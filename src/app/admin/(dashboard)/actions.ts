"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { requirePermission } from "@/lib/permissions";
import { setGlobalBufferHours, setBookingFeePercent, getBookingFeePercent } from "@/lib/settings";
import { logAudit } from "@/lib/audit";
import { saveAgreementFile, saveItemPhoto, saveCompanySignature } from "@/lib/uploads";
import { readPngDimensions } from "@/lib/png";
import { assignUnits, getAvailability, InsufficientAvailabilityError } from "@/lib/availability";
import { BookingConflictError } from "@/lib/booking";
import { slotWindow, toDateStr, type SlotKey } from "@/lib/slots";
import { getStripe } from "@/lib/stripe";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import type { BookingStatus, UnitStatus, PaymentMethod, Role } from "@prisma/client";

// --- Bookings ------------------------------------------------------------

// Server Actions redact thrown error messages once deployed (Next.js only
// passes the raw message through in dev), so each gate a status change can
// hit is communicated via a return value the client can branch on, not by
// throwing — throwing is reserved for genuinely unexpected failures.
export type UpdateBookingStatusResult =
  | { ok: true }
  | { ok: false; code: "AGREEMENT_REQUIRED" | "DEPOSIT_REQUIRED" | "BALANCE_REMAINING" };

export async function updateBookingStatus(
  bookingId: string,
  status: BookingStatus,
  options?: { overrideAgreement?: boolean; overridePayment?: boolean }
): Promise<UpdateBookingStatusResult> {
  const session = await requireSession();
  requirePermission(session, "bookings:write");

  let overrodeSomething = false;

  if (status === "CONFIRMED") {
    const booking = await prisma.booking.findUniqueOrThrow({ where: { id: bookingId } });
    if (!booking.agreementSigned && !options?.overrideAgreement) {
      return { ok: false, code: "AGREEMENT_REQUIRED" };
    }
    // "Confirmed (deposit paid)" — the non-refundable booking fee (Section 3
    // of the rental agreement) must be on record, not just the agreement.
    const bookingFeePercent = await getBookingFeePercent();
    const bookingFeeAmount = Number(booking.rentalFee) * (bookingFeePercent / 100);
    if (Number(booking.amountPaid) < bookingFeeAmount && !options?.overridePayment) {
      return { ok: false, code: "DEPOSIT_REQUIRED" };
    }
    overrodeSomething = Boolean(options?.overrideAgreement || options?.overridePayment);
  }

  if (status === "PAID_IN_FULL") {
    const booking = await prisma.booking.findUniqueOrThrow({
      where: { id: bookingId },
      include: { charges: true },
    });
    // Same balanceDue formula PaymentPanel already shows staff.
    const chargesTotal = booking.charges.reduce((s, c) => s + Number(c.unitPrice) * c.quantity, 0);
    const balanceDue =
      Number(booking.rentalFee) + Number(booking.securityDeposit) + chargesTotal - Number(booking.amountPaid);
    if (balanceDue > 0 && !options?.overridePayment) {
      return { ok: false, code: "BALANCE_REMAINING" };
    }
    overrodeSomething = Boolean(options?.overridePayment);
  }

  if (status === "CANCELLED") {
    // Free the equipment immediately rather than waiting out the buffer.
    await prisma.$transaction([
      prisma.bookingUnit.deleteMany({ where: { bookingId } }),
      prisma.booking.update({ where: { id: bookingId }, data: { status } }),
    ]);
  } else {
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status,
        agreementOverridden: options?.overrideAgreement ? true : undefined,
        depositOverridden: options?.overridePayment ? true : undefined,
      },
    });
  }

  await logAudit({
    entity: "Booking",
    entityId: bookingId,
    action: "status_change",
    detail: `Status changed to ${status}${overrodeSomething ? " (override)" : ""}`,
    actorId: session.id,
  });

  // A booking traces back to its originating lead via the quote it was
  // converted from (Quote.bookingId is unique — see convertQuoteToBooking).
  // Completing the booking is the pipeline's terminal auto-advance, mirroring
  // the QUOTE_SENT/BOOKING_CONFIRMED auto-advances in quotes/actions.ts.
  if (status === "COMPLETED") {
    const quote = await prisma.quote.findUnique({ where: { bookingId }, select: { leadId: true } });
    if (quote?.leadId) {
      const lead = await prisma.lead.findUnique({ where: { id: quote.leadId }, select: { stage: true } });
      if (lead && lead.stage !== "COMPLETED" && lead.stage !== "LOST") {
        await prisma.lead.update({ where: { id: quote.leadId }, data: { stage: "COMPLETED" } });
        await prisma.leadActivity.create({
          data: {
            leadId: quote.leadId,
            type: "note",
            content: "Booking marked completed — opportunity closed as Completed",
            staffId: session.id,
          },
        });
        revalidatePath("/admin/leads");
        revalidatePath(`/admin/leads/${quote.leadId}`);
      }
    }
  }

  revalidatePath("/admin/bookings");
  revalidatePath(`/admin/bookings/${bookingId}`);
  revalidatePath("/admin/calendar");
  revalidatePath("/admin");
  return { ok: true };
}

export async function updateBookingFinancials(
  bookingId: string,
  input: { rentalFee: number; securityDeposit: number; amountPaid: number; paymentMethod?: PaymentMethod | null }
) {
  const session = await requireSession();
  requirePermission(session, "bookings:financials:write");
  await prisma.booking.update({
    where: { id: bookingId },
    data: {
      rentalFee: input.rentalFee,
      securityDeposit: input.securityDeposit,
      amountPaid: input.amountPaid,
      paymentMethod: input.paymentMethod ?? undefined,
    },
  });
  await logAudit({
    entity: "Booking",
    entityId: bookingId,
    action: "financials_change",
    detail: `Rental fee $${input.rentalFee}, deposit $${input.securityDeposit}, paid $${input.amountPaid}`,
    actorId: session.id,
  });
  revalidatePath(`/admin/bookings/${bookingId}`);
}

// --- Online payments (Stripe Checkout) --------------------------------

// Creates a Stripe-hosted Checkout page for a staff-chosen amount (usually
// the current balance due) and records it as PENDING. amountPaid is NOT
// updated here — only the webhook, once Stripe confirms the payment
// actually went through, is trusted for that (see /api/webhooks/stripe).
// `origin` is passed from the client (window.location.origin) the same way
// share links are built elsewhere — see QuoteEditor's shareUrl.
export async function createStripePaymentLink(
  bookingId: string,
  amount: number,
  origin: string
): Promise<string> {
  const session = await requireSession();
  requirePermission(session, "bookings:financials:write");

  if (!(amount > 0)) {
    throw new Error("Amount must be greater than $0.");
  }

  const booking = await prisma.booking.findUniqueOrThrow({ where: { id: bookingId } });

  const checkoutSession = await getStripe().checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `Studio Melissa Rental — ${booking.eventName || "booking"} payment`,
          },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      },
    ],
    success_url: `${origin}/pay/success?booking=${bookingId}`,
    cancel_url: `${origin}/pay/cancelled?booking=${bookingId}`,
    metadata: { bookingId },
  });

  if (!checkoutSession.url) {
    throw new Error("Stripe did not return a checkout URL.");
  }

  await prisma.stripePayment.create({
    data: {
      bookingId,
      amount,
      stripeCheckoutSessionId: checkoutSession.id,
      createdById: session.id,
    },
  });

  await logAudit({
    entity: "Booking",
    entityId: bookingId,
    action: "stripe_payment_link_created",
    detail: `Created Stripe payment link for $${amount.toFixed(2)}`,
    actorId: session.id,
  });

  revalidatePath(`/admin/bookings/${bookingId}`);
  return checkoutSession.url;
}

export async function updateBookingRefund(
  bookingId: string,
  input: { refundIssued: number; refundNote?: string }
) {
  const session = await requireSession();
  requirePermission(session, "bookings:financials:write");
  await prisma.booking.update({
    where: { id: bookingId },
    data: {
      refundIssued: input.refundIssued,
      refundNote: input.refundNote || undefined,
      refundedAt: input.refundIssued > 0 ? new Date() : null,
    },
  });
  await logAudit({
    entity: "Booking",
    entityId: bookingId,
    action: "refund_recorded",
    detail: `Refund of $${input.refundIssued} recorded`,
    actorId: session.id,
  });
  revalidatePath(`/admin/bookings/${bookingId}`);
}

export async function uploadAgreementFile(bookingId: string, formData: FormData) {
  const session = await requireSession();
  requirePermission(session, "bookings:write");
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("No file provided.");
  }
  if (file.size > 15 * 1024 * 1024) {
    throw new Error("File too large (15MB max).");
  }
  const { url, fileName } = await saveAgreementFile(bookingId, file);
  await prisma.booking.update({
    where: { id: bookingId },
    data: {
      agreementFileUrl: url,
      agreementFileName: fileName,
      agreementSigned: true,
      agreementSignedAt: new Date(),
    },
  });
  await logAudit({
    entity: "Booking",
    entityId: bookingId,
    action: "agreement_uploaded",
    detail: `Signed agreement file uploaded: ${fileName}`,
    actorId: session.id,
  });
  revalidatePath(`/admin/bookings/${bookingId}`);
}

// --- Booking charges (add-ons / discounts) --------------------------------

export async function addBookingCharge(
  bookingId: string,
  input: { description: string; quantity: number; unitPrice: number }
) {
  const session = await requireSession();
  requirePermission(session, "bookings:financials:write");
  await prisma.bookingCharge.create({
    data: {
      bookingId,
      description: input.description,
      quantity: input.quantity,
      unitPrice: input.unitPrice,
    },
  });
  revalidatePath(`/admin/bookings/${bookingId}`);
}

export async function removeBookingCharge(chargeId: string, bookingId: string) {
  const session = await requireSession();
  requirePermission(session, "bookings:financials:write");
  await prisma.bookingCharge.delete({ where: { id: chargeId } });
  revalidatePath(`/admin/bookings/${bookingId}`);
}

// --- Booking schedule edit (date/slot) — re-checks conflicts --------------

export type RescheduleResult = { ok: true } | { ok: false; error: string };

export async function rescheduleBooking(
  bookingId: string,
  input: { date: string; slot: SlotKey }
): Promise<RescheduleResult> {
  const session = await requireSession();
  requirePermission(session, "bookings:write");

  const { startAt, endAt } = slotWindow(input.date, input.slot);

  try {
    await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUniqueOrThrow({
        where: { id: bookingId },
        include: { lines: true },
      });

      // Release the current assignments, then re-assign fresh ones for the
      // new date/slot — this is what forces a real conflict re-check rather
      // than trusting the old assignment still holds.
      await tx.bookingUnit.deleteMany({ where: { bookingId } });
      await tx.booking.update({
        where: { id: bookingId },
        data: { date: new Date(`${input.date}T00:00:00`), slot: input.slot, startAt, endAt },
      });

      for (const line of booking.lines) {
        await assignUnits(tx, {
          bookingId,
          itemId: line.itemId,
          dateStr: input.date,
          slot: input.slot,
          quantity: line.quantity,
        });
      }
    });
  } catch (err) {
    if (err instanceof InsufficientAvailabilityError) {
      return { ok: false, error: err.message };
    }
    throw err;
  }

  await logAudit({
    entity: "Booking",
    entityId: bookingId,
    action: "rescheduled",
    detail: `Rescheduled to ${input.date} (${input.slot})`,
    actorId: session.id,
  });

  revalidatePath("/admin/bookings");
  revalidatePath(`/admin/bookings/${bookingId}`);
  revalidatePath("/admin/calendar");
  revalidatePath("/admin/equipment-timeline");
  return { ok: true };
}

// --- Pull-sheet unit swap ---------------------------------------------------
// Spec: "Staff can swap an assigned unit for another of the same category
// before delivery (e.g. a unit needs maintenance) without breaking the
// booking." Package templates bind to a specific Item (not an abstract
// category — see PackageItem), so "same category" in practice means "same
// Item" — a swap candidate must be another unit of the exact item this
// BookingUnit row was assigned for.

// Read-only, so it only requires being logged in — same as loading the
// booking page itself; the mutation below is what's actually permission-gated.
export async function getSwapCandidates(
  bookingUnitId: string
): Promise<{ id: string; serialNumber: string }[]> {
  await requireSession();

  const bookingUnit = await prisma.bookingUnit.findUniqueOrThrow({
    where: { id: bookingUnitId },
    include: { unit: true, booking: true },
  });

  const dateStr = toDateStr(bookingUnit.booking.date);
  const { availableUnitIds } = await getAvailability(
    bookingUnit.unit.itemId,
    dateStr,
    bookingUnit.booking.slot
  );
  if (availableUnitIds.length === 0) return [];

  const candidates = await prisma.equipmentUnit.findMany({
    where: { id: { in: availableUnitIds } },
    orderBy: { serialNumber: "asc" },
    select: { id: true, serialNumber: true },
  });
  return candidates;
}

export type SwapUnitResult = { ok: true } | { ok: false; error: string };

export async function swapBookingUnit(
  bookingUnitId: string,
  newUnitId: string
): Promise<SwapUnitResult> {
  const session = await requireSession();
  requirePermission(session, "bookings:units:write");

  const bookingUnit = await prisma.bookingUnit.findUniqueOrThrow({
    where: { id: bookingUnitId },
    include: { unit: true, booking: true },
  });

  // "Before delivery" — once equipment is actually out, a swap isn't a paper
  // reassignment anymore, it's a real logistics problem staff need to solve
  // by hand (and Cancelled/Completed bookings shouldn't have units touched).
  if (!["PENDING", "CONFIRMED", "PAID_IN_FULL"].includes(bookingUnit.booking.status)) {
    return { ok: false, error: "This booking's equipment has already gone out — swap isn't available after delivery." };
  }

  const newUnit = await prisma.equipmentUnit.findUnique({ where: { id: newUnitId } });
  if (!newUnit || newUnit.itemId !== bookingUnit.unit.itemId) {
    return { ok: false, error: "The replacement unit must be the same item." };
  }
  if (!["AVAILABLE", "OUT"].includes(newUnit.status)) {
    return { ok: false, error: "That unit isn't eligible for booking (in maintenance or retired)." };
  }

  try {
    await prisma.bookingUnit.update({ where: { id: bookingUnitId }, data: { unitId: newUnitId } });
  } catch (err) {
    // Exactly the detection logic lib/booking.ts already uses for the same
    // BookingUnit EXCLUDE constraint — the availability check above can
    // still lose a race to a concurrent request between check and update.
    const isExclusionViolation =
      (err instanceof Prisma.PrismaClientKnownRequestError &&
        (err.code === "23505" || err.meta?.code === "23P01")) ||
      (err instanceof Error && /exclusion constraint/i.test(err.message));
    if (isExclusionViolation) {
      return { ok: false, error: new BookingConflictError().message };
    }
    throw err;
  }

  await logAudit({
    entity: "Booking",
    entityId: bookingUnit.bookingId,
    action: "unit_swapped",
    detail: `Swapped ${bookingUnit.unit.serialNumber} for ${newUnit.serialNumber}`,
    actorId: session.id,
  });

  revalidatePath(`/admin/bookings/${bookingUnit.bookingId}`);
  revalidatePath("/admin/calendar");
  revalidatePath("/admin/equipment-timeline");
  return { ok: true };
}

export async function updateAgreementStatus(bookingId: string, signed: boolean) {
  const session = await requireSession();
  requirePermission(session, "bookings:write");
  await prisma.booking.update({
    where: { id: bookingId },
    data: { agreementSigned: signed, agreementSignedAt: signed ? new Date() : null },
  });
  revalidatePath(`/admin/bookings/${bookingId}`);
}

export async function updateInsuranceStatus(bookingId: string, onFile: boolean) {
  const session = await requireSession();
  requirePermission(session, "bookings:write");
  await prisma.booking.update({ where: { id: bookingId }, data: { insuranceOnFile: onFile } });
  revalidatePath(`/admin/bookings/${bookingId}`);
}

// Delivery/pickup checklist (3.4) — address and the delivery/pickup windows
// themselves come from existing booking fields (eventAddress, date/slot);
// this covers the two pieces that don't already exist anywhere else.
export async function updateBookingChecklist(
  bookingId: string,
  input: { siteContactName?: string; siteContactPhone?: string; loadInNotes?: string }
) {
  const session = await requireSession();
  requirePermission(session, "bookings:write");
  await prisma.booking.update({
    where: { id: bookingId },
    data: {
      siteContactName: input.siteContactName || null,
      siteContactPhone: input.siteContactPhone || null,
      loadInNotes: input.loadInNotes || null,
    },
  });
  revalidatePath(`/admin/bookings/${bookingId}`);
}

export async function updateBookingFeePercent(percent: number) {
  const session = await requireSession();
  requirePermission(session, "settings:write");
  await setBookingFeePercent(percent);
  revalidatePath("/admin/settings");
}

// --- Inventory: categories & items ---------------------------------------

export async function createCategory(name: string) {
  const session = await requireSession();
  requirePermission(session, "inventory:catalog:write");
  await prisma.category.create({ data: { name } });
  revalidatePath("/admin/inventory");
}

export async function createItem(input: {
  name: string;
  categoryId: string;
  description?: string;
  dailyRate: number;
  bufferHours?: number | null;
}) {
  const session = await requireSession();
  requirePermission(session, "inventory:catalog:write");
  const item = await prisma.item.create({
    data: {
      name: input.name,
      categoryId: input.categoryId,
      description: input.description || undefined,
      dailyRate: input.dailyRate,
      bufferHours: input.bufferHours ?? null,
    },
  });
  revalidatePath("/admin/inventory");
  return item.id;
}

export async function updateItem(
  id: string,
  input: {
    name: string;
    categoryId: string;
    description?: string;
    dailyRate: number;
    bufferHours?: number | null;
    active: boolean;
  }
) {
  const session = await requireSession();
  requirePermission(session, "inventory:catalog:write");
  await prisma.item.update({
    where: { id },
    data: {
      name: input.name,
      categoryId: input.categoryId,
      description: input.description || undefined,
      dailyRate: input.dailyRate,
      bufferHours: input.bufferHours ?? null,
      active: input.active,
    },
  });
  revalidatePath("/admin/inventory");
  revalidatePath(`/admin/inventory/${id}`);
}

export async function uploadItemPhoto(itemId: string, formData: FormData) {
  const session = await requireSession();
  requirePermission(session, "inventory:catalog:write");
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("No file provided.");
  }
  if (file.size > 8 * 1024 * 1024) {
    throw new Error("Image too large (8MB max).");
  }
  const { url } = await saveItemPhoto(itemId, file);
  await prisma.item.update({ where: { id: itemId }, data: { photoUrl: url } });
  revalidatePath("/admin/inventory");
  revalidatePath(`/admin/inventory/${itemId}`);
  revalidatePath("/");
  revalidatePath(`/items/${itemId}`);
}

export async function removeItemPhoto(itemId: string) {
  const session = await requireSession();
  requirePermission(session, "inventory:catalog:write");
  await prisma.item.update({ where: { id: itemId }, data: { photoUrl: null } });
  revalidatePath("/admin/inventory");
  revalidatePath(`/admin/inventory/${itemId}`);
  revalidatePath("/");
  revalidatePath(`/items/${itemId}`);
}

// --- Inventory: units & maintenance ---------------------------------------

export async function createUnit(itemId: string, serialNumber: string, notes?: string) {
  const session = await requireSession();
  requirePermission(session, "inventory:units:write");
  await prisma.equipmentUnit.create({
    data: { itemId, serialNumber, notes: notes || undefined },
  });
  revalidatePath(`/admin/inventory/${itemId}`);
}

export async function updateUnitDetails(
  unitId: string,
  itemId: string,
  input: { purchaseDate?: string | null; purchaseCost?: number | null; notes?: string }
) {
  const session = await requireSession();
  requirePermission(session, "inventory:units:write");
  await prisma.equipmentUnit.update({
    where: { id: unitId },
    data: {
      purchaseDate: input.purchaseDate ? new Date(`${input.purchaseDate}T00:00:00`) : null,
      purchaseCost: input.purchaseCost ?? null,
      notes: input.notes || undefined,
    },
  });
  revalidatePath(`/admin/inventory/${itemId}`);
}

export type DeleteUnitResult = { ok: true } | { ok: false; error: string };

// Deleting a unit with any booking/maintenance history would silently erase
// part of that history (which past pull sheets pointed at this exact serial
// number), so it's left to the DB's ON DELETE RESTRICT foreign keys to be
// the real guard — this just turns that into a friendly message instead of
// an unhandled 500. Retiring (status change) is the correct way to take a
// unit with real history out of service; delete is for fixing mistakes like
// a duplicate or mistyped entry that was never actually booked.
export async function deleteUnit(unitId: string, itemId: string): Promise<DeleteUnitResult> {
  const session = await requireSession();
  requirePermission(session, "inventory:units:write");
  try {
    await prisma.equipmentUnit.delete({ where: { id: unitId } });
  } catch (err) {
    // A plain SQL-level ON DELETE RESTRICT (as opposed to a relation Prisma
    // manages itself) doesn't reliably come through as the "known" P2003 —
    // it can also surface as PrismaClientUnknownRequestError wrapping the
    // raw Postgres restrict_violation. Check both error classes' messages
    // for the constraint signature rather than trusting a single error code.
    const message = err instanceof Error ? err.message : String(err);
    const isForeignKeyRestrict =
      (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2003") ||
      /foreign key constraint|violates restrict/i.test(message);
    if (isForeignKeyRestrict) {
      return {
        ok: false,
        error: "Can't delete — this unit has booking or maintenance history. Use Retired status instead.",
      };
    }
    throw err;
  }
  revalidatePath(`/admin/inventory/${itemId}`);
  return { ok: true };
}

export async function updateUnitStatus(unitId: string, itemId: string, status: UnitStatus) {
  const session = await requireSession();
  requirePermission(session, "inventory:units:write");
  await prisma.equipmentUnit.update({ where: { id: unitId }, data: { status } });
  revalidatePath(`/admin/inventory/${itemId}`);
}

export async function addMaintenanceLog(unitId: string, itemId: string, description: string) {
  const session = await requireSession();
  requirePermission(session, "maintenance:flag");
  await prisma.$transaction([
    prisma.maintenanceLog.create({ data: { unitId, description } }),
    prisma.equipmentUnit.update({ where: { id: unitId }, data: { status: "MAINTENANCE" } }),
  ]);
  revalidatePath(`/admin/inventory/${itemId}`);
}

export async function resolveMaintenanceLog(logId: string, unitId: string, itemId: string) {
  const session = await requireSession();
  requirePermission(session, "inventory:units:write");
  await prisma.$transaction([
    prisma.maintenanceLog.update({
      where: { id: logId },
      data: { resolved: true, resolvedBy: session.name, resolvedAt: new Date() },
    }),
    prisma.equipmentUnit.update({ where: { id: unitId }, data: { status: "AVAILABLE" } }),
  ]);
  revalidatePath(`/admin/inventory/${itemId}`);
}

// --- Customers -------------------------------------------------------------

export async function updateCustomer(
  id: string,
  input: { name: string; email?: string; phone?: string; org?: string; notes?: string; tags: string[] }
) {
  const session = await requireSession();
  requirePermission(session, "customers:write");
  await prisma.customer.update({
    where: { id },
    data: {
      name: input.name,
      email: input.email || null,
      phone: input.phone || null,
      org: input.org || null,
      notes: input.notes || null,
      tags: input.tags,
    },
  });
  revalidatePath("/admin/customers");
  revalidatePath(`/admin/customers/${id}`);
}

// --- Settings ----------------------------------------------------------------

export async function updateBufferHours(hours: number) {
  const session = await requireSession();
  requirePermission(session, "settings:write");
  await setGlobalBufferHours(hours);
  revalidatePath("/admin/settings");
}

// The one company-side signature image, reused for every lead countersign
// (see countersignLeadAsCompany) — same 772x229 PNG / 500KB spec as the
// customer-uploaded ones, checked the same way.
export async function uploadCompanySignature(formData: FormData) {
  const session = await requireSession();
  requirePermission(session, "settings:write");

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("No file provided.");
  }
  if (file.type !== "image/png") {
    throw new Error("Signature must be a PNG image.");
  }
  if (file.size > 500 * 1024) {
    throw new Error("Signature image is too large (500KB max).");
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  const dimensions = readPngDimensions(buffer);
  if (!dimensions || dimensions.width !== 772 || dimensions.height !== 229) {
    throw new Error("Signature image must be exactly 772x229px.");
  }

  const { url } = await saveCompanySignature(buffer);
  await prisma.setting.upsert({
    where: { key: "companySignatureUrl" },
    update: { value: url },
    create: { key: "companySignatureUrl", value: url },
  });
  revalidatePath("/admin/settings");
}

// --- Packages (composition + pricing) ---------------------------------------

export async function updatePackage(
  id: string,
  input: { description?: string; price: number; active: boolean }
) {
  const session = await requireSession();
  requirePermission(session, "packages:write");
  await prisma.package.update({
    where: { id },
    data: { description: input.description || undefined, price: input.price, active: input.active },
  });
  revalidatePath("/admin/packages");
  revalidatePath(`/admin/packages/${id}`);
  revalidatePath("/");
}

export async function addPackageComponent(packageId: string, itemId: string, quantity: number) {
  const session = await requireSession();
  requirePermission(session, "packages:write");
  await prisma.packageItem.upsert({
    where: { packageId_itemId: { packageId, itemId } },
    update: { quantity },
    create: { packageId, itemId, quantity },
  });
  revalidatePath(`/admin/packages/${packageId}`);
  revalidatePath("/");
}

export async function updatePackageComponentQuantity(componentId: string, packageId: string, quantity: number) {
  const session = await requireSession();
  requirePermission(session, "packages:write");
  await prisma.packageItem.update({ where: { id: componentId }, data: { quantity } });
  revalidatePath(`/admin/packages/${packageId}`);
  revalidatePath("/");
}

export async function removePackageComponent(componentId: string, packageId: string) {
  const session = await requireSession();
  requirePermission(session, "packages:write");
  await prisma.packageItem.delete({ where: { id: componentId } });
  revalidatePath(`/admin/packages/${packageId}`);
  revalidatePath("/");
}

// --- Add-ons -----------------------------------------------------------------

export async function createAddOn(input: { name: string; price: number }) {
  const session = await requireSession();
  requirePermission(session, "addons:write");
  await prisma.addOn.create({ data: { name: input.name, price: input.price } });
  revalidatePath("/admin/addons");
}

export async function updateAddOn(id: string, input: { name: string; price: number; active: boolean }) {
  const session = await requireSession();
  requirePermission(session, "addons:write");
  await prisma.addOn.update({
    where: { id },
    data: { name: input.name, price: input.price, active: input.active },
  });
  revalidatePath("/admin/addons");
}

// --- Staff accounts ------------------------------------------------------------

export async function createStaffUser(input: {
  name: string;
  email: string;
  password: string;
  role: Role;
}) {
  const session = await requireSession();
  requirePermission(session, "staff:manage");
  const passwordHash = await bcrypt.hash(input.password, 10);
  await prisma.user.create({
    data: { name: input.name, email: input.email, passwordHash, role: input.role },
  });
  revalidatePath("/admin/staff");
}

export async function updateStaffRole(userId: string, role: Role) {
  const session = await requireSession();
  requirePermission(session, "staff:manage");
  await prisma.user.update({ where: { id: userId }, data: { role } });
  revalidatePath("/admin/staff");
}

export async function resetStaffPassword(userId: string, newPassword: string) {
  const session = await requireSession();
  requirePermission(session, "staff:manage");
  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  revalidatePath("/admin/staff");
}

export async function deleteStaffUser(userId: string) {
  const session = await requireSession();
  requirePermission(session, "staff:manage");
  if (userId === session.id) {
    throw new Error("You can't delete your own account while signed in as it.");
  }
  await prisma.user.delete({ where: { id: userId } });
  revalidatePath("/admin/staff");
}
