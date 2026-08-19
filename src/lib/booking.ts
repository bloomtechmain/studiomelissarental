import { prisma } from "@/lib/prisma";
import { assignUnits, InsufficientAvailabilityError } from "@/lib/availability";
import { slotWindow } from "@/lib/slots";
import type { BookingInput } from "@/lib/validation";
import { Prisma } from "@prisma/client";

// Postgres error code for a unique/exclusion constraint violation — this is
// the DB-level EXCLUDE constraint on BookingUnit catching a race that slipped
// past the application-level availability check (two requests for the last
// free unit landing at almost the same instant).
const POSTGRES_EXCLUSION_VIOLATION = "23P01";
const POSTGRES_UNIQUE_VIOLATION = "23505";

export class BookingConflictError extends Error {
  constructor() {
    super(
      "That item just became unavailable for the selected date/slot (someone else booked it first). Please pick another slot or reduce the quantity."
    );
    this.name = "BookingConflictError";
  }
}

async function resolveCustomer(
  tx: Prisma.TransactionClient,
  customer: { name: string; email?: string; phone: string; org?: string }
) {
  const email = customer.email?.trim() || undefined;
  const existing = email
    ? await tx.customer.findFirst({ where: { email } })
    : await tx.customer.findFirst({ where: { phone: customer.phone } });

  if (existing) {
    return tx.customer.update({
      where: { id: existing.id },
      data: {
        name: customer.name,
        phone: customer.phone,
        org: customer.org || existing.org,
        email: email ?? existing.email,
      },
    });
  }

  return tx.customer.create({
    data: {
      name: customer.name,
      phone: customer.phone,
      email,
      org: customer.org || undefined,
    },
  });
}

export async function createBooking(input: BookingInput) {
  const { startAt, endAt } = slotWindow(input.date, input.slot);

  try {
    return await prisma.$transaction(async (tx) => {
      const customer = await resolveCustomer(tx, input.customer);

      if (input.kind === "item") {
        const item = await tx.item.findUniqueOrThrow({ where: { id: input.itemId } });
        const booking = await tx.booking.create({
          data: {
            customerId: customer.id,
            eventName: input.eventName || undefined,
            eventAddress: input.eventAddress || undefined,
            notes: input.notes || undefined,
            date: new Date(`${input.date}T00:00:00`),
            slot: input.slot,
            startAt,
            endAt,
            lines: {
              create: [{ itemId: item.id, quantity: input.quantity }],
            },
          },
        });
        await assignUnits(tx, {
          bookingId: booking.id,
          itemId: item.id,
          dateStr: input.date,
          slot: input.slot,
          quantity: input.quantity,
        });
        return booking;
      }

      // Package booking: one BookingLine per component, all assigned inside
      // the same transaction so it's all-or-nothing.
      const pkg = await tx.package.findUniqueOrThrow({
        where: { id: input.packageId },
        include: { components: true },
      });
      if (pkg.components.length === 0) {
        throw new Error(
          `"${pkg.name}" is a custom/quoted package with no fixed components — it can't be self-booked online.`
        );
      }

      const booking = await tx.booking.create({
        data: {
          customerId: customer.id,
          packageId: pkg.id,
          eventName: input.eventName || undefined,
          eventAddress: input.eventAddress || undefined,
          notes: input.notes || undefined,
          date: new Date(`${input.date}T00:00:00`),
          slot: input.slot,
          startAt,
          endAt,
          lines: {
            create: pkg.components.map((c) => ({ itemId: c.itemId, quantity: c.quantity })),
          },
        },
      });

      for (const comp of pkg.components) {
        await assignUnits(tx, {
          bookingId: booking.id,
          itemId: comp.itemId,
          dateStr: input.date,
          slot: input.slot,
          quantity: comp.quantity,
        });
      }

      return booking;
    });
  } catch (err) {
    if (err instanceof InsufficientAvailabilityError) throw err;
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      (err.code === POSTGRES_UNIQUE_VIOLATION || err.meta?.code === POSTGRES_EXCLUSION_VIOLATION)
    ) {
      throw new BookingConflictError();
    }
    // Raw exclusion-constraint violations surface as a generic query error
    // rather than a mapped Prisma error code; detect by message instead.
    if (err instanceof Error && /exclusion constraint/i.test(err.message)) {
      throw new BookingConflictError();
    }
    throw err;
  }
}
