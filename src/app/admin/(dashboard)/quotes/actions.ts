"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { requirePermission } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { assignUnits, InsufficientAvailabilityError } from "@/lib/availability";
import { slotWindow, type SlotKey } from "@/lib/slots";
import type { QuoteStatus } from "@prisma/client";

export async function createQuote(input: {
  leadId?: string;
  customerId?: string;
  packageId?: string;
  eventName?: string;
  eventAddress?: string;
  eventDate?: string;
  slot?: SlotKey;
}) {
  const session = await requireSession();
  requirePermission(session, "quotes:write");

  let basePrice = 0;
  const lines: { description: string; quantity: number; unitPrice: number }[] = [];
  if (input.packageId) {
    const pkg = await prisma.package.findUnique({ where: { id: input.packageId } });
    if (pkg) {
      basePrice = Number(pkg.price);
      lines.push({ description: `Package: ${pkg.name}`, quantity: 1, unitPrice: basePrice });
    }
  }

  const quote = await prisma.quote.create({
    data: {
      leadId: input.leadId || undefined,
      customerId: input.customerId || undefined,
      packageId: input.packageId || undefined,
      eventName: input.eventName || undefined,
      eventAddress: input.eventAddress || undefined,
      eventDate: input.eventDate ? new Date(`${input.eventDate}T00:00:00`) : undefined,
      slot: input.slot || undefined,
      basePrice,
      createdById: session.id,
      lines: { create: lines },
    },
  });

  if (input.leadId) {
    await prisma.leadActivity.create({
      data: { leadId: input.leadId, type: "quote_sent", content: "Quote drafted", staffId: session.id },
    });
    await prisma.lead.update({ where: { id: input.leadId }, data: { stage: "QUOTE_SENT" } });
  }

  revalidatePath("/admin/quotes");
  return quote.id;
}

export async function addQuoteLine(
  quoteId: string,
  input: { description: string; quantity: number; unitPrice: number }
) {
  const session = await requireSession();
  requirePermission(session, "quotes:write");
  await prisma.quoteLine.create({
    data: { quoteId, description: input.description, quantity: input.quantity, unitPrice: input.unitPrice },
  });
  revalidatePath(`/admin/quotes/${quoteId}`);
}

export async function removeQuoteLine(lineId: string, quoteId: string) {
  const session = await requireSession();
  requirePermission(session, "quotes:write");
  await prisma.quoteLine.delete({ where: { id: lineId } });
  revalidatePath(`/admin/quotes/${quoteId}`);
}

export async function updateQuoteDetails(
  quoteId: string,
  input: {
    eventName?: string;
    eventAddress?: string;
    eventDate?: string;
    slot?: SlotKey;
    expiresAt?: string;
    status: QuoteStatus;
    customerId?: string;
  }
) {
  const session = await requireSession();
  requirePermission(session, "quotes:write");
  await prisma.quote.update({
    where: { id: quoteId },
    data: {
      eventName: input.eventName || undefined,
      eventAddress: input.eventAddress || undefined,
      eventDate: input.eventDate ? new Date(`${input.eventDate}T00:00:00`) : undefined,
      slot: input.slot || undefined,
      expiresAt: input.expiresAt ? new Date(`${input.expiresAt}T00:00:00`) : undefined,
      status: input.status,
      customerId: input.customerId || undefined,
    },
  });
  revalidatePath(`/admin/quotes/${quoteId}`);
}

export type ConvertQuoteResult = { ok: true; bookingId: string } | { ok: false; error: string };

// "A quote can be converted directly into a Booking with one action,
// without re-entering line items."
export async function convertQuoteToBooking(quoteId: string): Promise<ConvertQuoteResult> {
  const session = await requireSession();
  requirePermission(session, "quotes:write");

  const quote = await prisma.quote.findUniqueOrThrow({
    where: { id: quoteId },
    include: { lines: true, customer: true, lead: true, package: true },
  });

  if (!quote.customerId) {
    return { ok: false, error: "Attach a customer to this quote before converting it to a booking." };
  }
  if (!quote.eventDate || !quote.slot) {
    return { ok: false, error: "Set an event date and time slot on this quote first." };
  }
  if (!quote.packageId) {
    return { ok: false, error: "Convert only supports package-based quotes right now — attach a package." };
  }

  const dateStr = quote.eventDate.toISOString().slice(0, 10);
  const { startAt, endAt } = slotWindow(dateStr, quote.slot);
  const total = quote.lines.reduce((sum, l) => sum + Number(l.unitPrice) * l.quantity, 0);

  try {
    const bookingId = await prisma.$transaction(async (tx) => {
      const pkg = await tx.package.findUniqueOrThrow({
        where: { id: quote.packageId! },
        include: { components: true },
      });

      const booking = await tx.booking.create({
        data: {
          customerId: quote.customerId!,
          packageId: pkg.id,
          eventName: quote.eventName || undefined,
          eventAddress: quote.eventAddress || undefined,
          date: quote.eventDate!,
          slot: quote.slot!,
          startAt,
          endAt,
          rentalFee: total,
          createdById: session.id,
          lines: { create: pkg.components.map((c) => ({ itemId: c.itemId, quantity: c.quantity })) },
        },
      });

      for (const comp of pkg.components) {
        await assignUnits(tx, {
          bookingId: booking.id,
          itemId: comp.itemId,
          dateStr,
          slot: quote.slot!,
          quantity: comp.quantity,
        });
      }

      await tx.quote.update({
        where: { id: quoteId },
        data: { status: "ACCEPTED", bookingId: booking.id },
      });

      return booking.id;
    });

    if (quote.leadId) {
      await prisma.lead.update({ where: { id: quote.leadId }, data: { stage: "BOOKING_CONFIRMED" } });
      await prisma.leadActivity.create({
        data: { leadId: quote.leadId, type: "note", content: "Quote converted to booking", staffId: session.id },
      });
    }

    await logAudit({
      entity: "Quote",
      entityId: quoteId,
      action: "converted_to_booking",
      detail: `Converted to booking ${bookingId}`,
      actorId: session.id,
    });

    revalidatePath(`/admin/quotes/${quoteId}`);
    revalidatePath("/admin/bookings");
    return { ok: true, bookingId };
  } catch (err) {
    if (err instanceof InsufficientAvailabilityError) {
      return { ok: false, error: err.message };
    }
    throw err;
  }
}
