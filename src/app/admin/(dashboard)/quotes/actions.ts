"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { requirePermission } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { assignUnits, InsufficientAvailabilityError } from "@/lib/availability";
import { slotWindow, toDateStr, type SlotKey } from "@/lib/slots";
import { generateShareToken } from "@/lib/tokens";
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

// Returns the quote's public share token, generating one on first request —
// see the shareToken comment on the Quote model for why it's lazy rather
// than backfilled. The resulting link (/q/[token]) is public and unauthenticated
// by design, so treat the token itself as a bearer credential in the URL.
export async function getOrCreateShareLink(quoteId: string): Promise<string> {
  const session = await requireSession();
  requirePermission(session, "quotes:write");

  const quote = await prisma.quote.findUniqueOrThrow({ where: { id: quoteId }, select: { shareToken: true } });
  if (quote.shareToken) return quote.shareToken;

  const shareToken = generateShareToken();
  await prisma.quote.update({ where: { id: quoteId }, data: { shareToken } });
  revalidatePath(`/admin/quotes/${quoteId}`);
  return shareToken;
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
  if (!quote.packageId && quote.lines.length === 0) {
    return { ok: false, error: "Add at least one line item before converting this quote." };
  }

  const dateStr = toDateStr(quote.eventDate);
  const { startAt, endAt } = slotWindow(dateStr, quote.slot);
  const total = quote.lines.reduce((sum, l) => sum + Number(l.unitPrice) * l.quantity, 0);

  try {
    const bookingId = await prisma.$transaction(async (tx) => {
      // Package-based quotes assign real equipment from the package's
      // components (same as before). Custom (line-item-only) quotes have no
      // catalog items to assign — their line items carry over as
      // BookingCharge rows instead, so the itemization isn't lost, but no
      // physical inventory is reserved and staff attach equipment manually.
      const pkg = quote.packageId
        ? await tx.package.findUniqueOrThrow({ where: { id: quote.packageId }, include: { components: true } })
        : null;

      // One rental agreement per customer, not one per stage of the
      // pipeline: if they already signed it as a lead (quote-request
      // e-signature), that signature carries straight onto the booking
      // instead of asking them to sign again.
      const leadSignature =
        quote.lead?.signatureName && quote.lead?.signatureCode
          ? {
              agreementSigned: true,
              agreementSignedAt: quote.lead.signedAt ?? undefined,
              signatureName: quote.lead.signatureName,
              signatureHash: quote.lead.signatureCode,
              signatureIp: quote.lead.signatureIp ?? undefined,
              signatureImageUrl: quote.lead.signatureImageUrl ?? undefined,
            }
          : undefined;

      const booking = await tx.booking.create({
        data: {
          customerId: quote.customerId!,
          packageId: pkg?.id,
          eventName: quote.eventName || undefined,
          eventAddress: quote.eventAddress || undefined,
          date: quote.eventDate!,
          slot: quote.slot!,
          startAt,
          endAt,
          rentalFee: total,
          createdById: session.id,
          lines: pkg ? { create: pkg.components.map((c) => ({ itemId: c.itemId, quantity: c.quantity })) } : undefined,
          ...leadSignature,
        },
      });

      if (pkg) {
        for (const comp of pkg.components) {
          await assignUnits(tx, {
            bookingId: booking.id,
            itemId: comp.itemId,
            dateStr,
            slot: quote.slot!,
            quantity: comp.quantity,
          });
        }
      } else {
        await tx.bookingCharge.createMany({
          data: quote.lines.map((l) => ({
            bookingId: booking.id,
            description: l.description,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
          })),
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
