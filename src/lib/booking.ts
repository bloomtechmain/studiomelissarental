import { prisma } from "@/lib/prisma";
import { assignUnits, InsufficientAvailabilityError } from "@/lib/availability";
import { rentalWindow, parsePickupAt, toDateStr } from "@/lib/rental";
import { generateSignatureCode } from "@/lib/signatureEncryption";
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
      "That item just became unavailable for the selected pickup time (someone else booked it first). Please pick another time or reduce the quantity."
    );
    this.name = "BookingConflictError";
  }
}

async function resolveCustomer(
  tx: Prisma.TransactionClient,
  customer: { name: string; email?: string; phone: string; org?: string }
) {
  const email = customer.email?.trim().toLowerCase() || undefined;
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

export async function createBooking(input: BookingInput, signerIp: string) {
  const pickupAt = parsePickupAt(input.pickupAt);
  const { startAt, endAt } = rentalWindow(pickupAt);
  const dateStr = toDateStr(pickupAt);

  // Same signature evidence regardless of which branch below actually
  // creates the booking — computed once so both stay identical.
  const signedAt = new Date();
  const { code } = generateSignatureCode({
    name: input.signatureName,
    contact: input.customer.email || input.customer.phone,
    ip: signerIp,
    timestamp: signedAt,
  });
  const signatureFields = {
    agreementSigned: true,
    agreementSignedAt: signedAt,
    signatureName: input.signatureName,
    signatureHash: code,
    signatureIp: signerIp,
  };

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
            date: new Date(`${dateStr}T00:00:00`),
            pickupAt,
            startAt,
            endAt,
            fulfillmentType: "SELF_PICKUP",
            ...signatureFields,
            lines: {
              create: [{ itemId: item.id, quantity: input.quantity }],
            },
          },
        });
        await assignUnits(tx, {
          bookingId: booking.id,
          itemId: item.id,
          pickupAt,
          quantity: input.quantity,
        });
        return booking;
      }

      if (input.kind === "cart") {
        // Defense in depth against a malformed/duplicated payload — the cart
        // UI itself already keys lines by itemId, so this should be a no-op.
        const merged = new Map<string, number>();
        for (const line of input.lines) {
          merged.set(line.itemId, (merged.get(line.itemId) ?? 0) + line.quantity);
        }
        const items = await tx.item.findMany({ where: { id: { in: [...merged.keys()] } } });
        if (items.length !== merged.size) {
          throw new Error("One or more items in the cart no longer exist.");
        }

        const booking = await tx.booking.create({
          data: {
            customerId: customer.id,
            eventName: input.eventName || undefined,
            eventAddress: input.eventAddress || undefined,
            notes: input.notes || undefined,
            date: new Date(`${dateStr}T00:00:00`),
            pickupAt,
            startAt,
            endAt,
            fulfillmentType: "SELF_PICKUP",
            ...signatureFields,
            lines: {
              create: [...merged.entries()].map(([itemId, quantity]) => ({ itemId, quantity })),
            },
          },
        });

        for (const [itemId, quantity] of merged) {
          await assignUnits(tx, { bookingId: booking.id, itemId, pickupAt, quantity });
        }

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
          date: new Date(`${dateStr}T00:00:00`),
          pickupAt,
          startAt,
          endAt,
          fulfillmentType: "DELIVERY",
          ...signatureFields,
          lines: {
            create: pkg.components.map((c) => ({ itemId: c.itemId, quantity: c.quantity })),
          },
        },
      });

      for (const comp of pkg.components) {
        await assignUnits(tx, {
          bookingId: booking.id,
          itemId: comp.itemId,
          pickupAt,
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
