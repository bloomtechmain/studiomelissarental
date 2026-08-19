"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession, requireRole } from "@/lib/auth";
import { setGlobalBufferHours, setBookingFeePercent } from "@/lib/settings";
import { logAudit } from "@/lib/audit";
import { saveAgreementFile } from "@/lib/uploads";
import { assignUnits, InsufficientAvailabilityError } from "@/lib/availability";
import { slotWindow, type SlotKey } from "@/lib/slots";
import bcrypt from "bcryptjs";
import type { BookingStatus, UnitStatus, PaymentMethod, Role } from "@prisma/client";

// --- Bookings ------------------------------------------------------------

// Server Actions redact thrown error messages once deployed (Next.js only
// passes the raw message through in dev), so the "needs a signed agreement"
// case is communicated via a return value the client can branch on, not by
// throwing — throwing is reserved for genuinely unexpected failures.
export type UpdateBookingStatusResult = { ok: true } | { ok: false; code: "AGREEMENT_REQUIRED" };

export async function updateBookingStatus(
  bookingId: string,
  status: BookingStatus,
  options?: { overrideAgreement?: boolean }
): Promise<UpdateBookingStatusResult> {
  const session = await requireSession();
  requireRole(session, ["ADMIN", "STAFF_BOOKINGS"]);

  if (status === "CONFIRMED") {
    const booking = await prisma.booking.findUniqueOrThrow({ where: { id: bookingId } });
    if (!booking.agreementSigned && !options?.overrideAgreement) {
      return { ok: false, code: "AGREEMENT_REQUIRED" };
    }
  }

  if (status === "CANCELLED") {
    // Free the equipment immediately rather than waiting out the buffer.
    await prisma.$transaction([
      prisma.bookingUnit.deleteMany({ where: { bookingId } }),
      prisma.booking.update({ where: { id: bookingId }, data: { status } }),
    ]);
  } else if (status === "CONFIRMED" && options?.overrideAgreement) {
    await prisma.booking.update({
      where: { id: bookingId },
      data: { status, agreementOverridden: true },
    });
  } else {
    await prisma.booking.update({ where: { id: bookingId }, data: { status } });
  }

  await logAudit({
    entity: "Booking",
    entityId: bookingId,
    action: "status_change",
    detail: `Status changed to ${status}${options?.overrideAgreement ? " (agreement override)" : ""}`,
    actorId: session.id,
  });

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
  requireRole(session, ["ADMIN", "STAFF_BOOKINGS"]);
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

export async function updateBookingRefund(
  bookingId: string,
  input: { refundIssued: number; refundNote?: string }
) {
  const session = await requireSession();
  requireRole(session, ["ADMIN", "STAFF_BOOKINGS"]);
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
  requireRole(session, ["ADMIN", "STAFF_BOOKINGS"]);
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
  requireRole(session, ["ADMIN", "STAFF_BOOKINGS"]);
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
  requireRole(session, ["ADMIN", "STAFF_BOOKINGS"]);
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
  requireRole(session, ["ADMIN", "STAFF_BOOKINGS"]);

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

export async function updateAgreementStatus(bookingId: string, signed: boolean) {
  const session = await requireSession();
  requireRole(session, ["ADMIN", "STAFF_BOOKINGS"]);
  await prisma.booking.update({
    where: { id: bookingId },
    data: { agreementSigned: signed, agreementSignedAt: signed ? new Date() : null },
  });
  revalidatePath(`/admin/bookings/${bookingId}`);
}

export async function updateInsuranceStatus(bookingId: string, onFile: boolean) {
  const session = await requireSession();
  requireRole(session, ["ADMIN", "STAFF_BOOKINGS"]);
  await prisma.booking.update({ where: { id: bookingId }, data: { insuranceOnFile: onFile } });
  revalidatePath(`/admin/bookings/${bookingId}`);
}

export async function updateBookingFeePercent(percent: number) {
  const session = await requireSession();
  requireRole(session, ["ADMIN"]);
  await setBookingFeePercent(percent);
  revalidatePath("/admin/settings");
}

// --- Inventory: categories & items ---------------------------------------

export async function createCategory(name: string) {
  const session = await requireSession();
  requireRole(session, ["ADMIN"]);
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
  requireRole(session, ["ADMIN"]);
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
  requireRole(session, ["ADMIN"]);
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

// --- Inventory: units & maintenance ---------------------------------------

export async function createUnit(itemId: string, serialNumber: string, notes?: string) {
  const session = await requireSession();
  requireRole(session, ["ADMIN", "STAFF_WAREHOUSE"]);
  await prisma.equipmentUnit.create({
    data: { itemId, serialNumber, notes: notes || undefined },
  });
  revalidatePath(`/admin/inventory/${itemId}`);
}

export async function updateUnitStatus(unitId: string, itemId: string, status: UnitStatus) {
  const session = await requireSession();
  requireRole(session, ["ADMIN", "STAFF_WAREHOUSE"]);
  await prisma.equipmentUnit.update({ where: { id: unitId }, data: { status } });
  revalidatePath(`/admin/inventory/${itemId}`);
}

export async function addMaintenanceLog(unitId: string, itemId: string, description: string) {
  const session = await requireSession();
  requireRole(session, ["ADMIN", "STAFF_WAREHOUSE"]);
  await prisma.$transaction([
    prisma.maintenanceLog.create({ data: { unitId, description } }),
    prisma.equipmentUnit.update({ where: { id: unitId }, data: { status: "MAINTENANCE" } }),
  ]);
  revalidatePath(`/admin/inventory/${itemId}`);
}

export async function resolveMaintenanceLog(logId: string, unitId: string, itemId: string) {
  const session = await requireSession();
  requireRole(session, ["ADMIN", "STAFF_WAREHOUSE"]);
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
  requireRole(session, ["ADMIN", "STAFF_BOOKINGS"]);
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
  requireRole(session, ["ADMIN"]);
  await setGlobalBufferHours(hours);
  revalidatePath("/admin/settings");
}

// --- Packages (composition + pricing) ---------------------------------------

export async function updatePackage(
  id: string,
  input: { description?: string; price: number; active: boolean }
) {
  const session = await requireSession();
  requireRole(session, ["ADMIN"]);
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
  requireRole(session, ["ADMIN"]);
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
  requireRole(session, ["ADMIN"]);
  await prisma.packageItem.update({ where: { id: componentId }, data: { quantity } });
  revalidatePath(`/admin/packages/${packageId}`);
  revalidatePath("/");
}

export async function removePackageComponent(componentId: string, packageId: string) {
  const session = await requireSession();
  requireRole(session, ["ADMIN"]);
  await prisma.packageItem.delete({ where: { id: componentId } });
  revalidatePath(`/admin/packages/${packageId}`);
  revalidatePath("/");
}

// --- Add-ons -----------------------------------------------------------------

export async function createAddOn(input: { name: string; price: number }) {
  const session = await requireSession();
  requireRole(session, ["ADMIN"]);
  await prisma.addOn.create({ data: { name: input.name, price: input.price } });
  revalidatePath("/admin/addons");
}

export async function updateAddOn(id: string, input: { name: string; price: number; active: boolean }) {
  const session = await requireSession();
  requireRole(session, ["ADMIN"]);
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
  requireRole(session, ["ADMIN"]);
  const passwordHash = await bcrypt.hash(input.password, 10);
  await prisma.user.create({
    data: { name: input.name, email: input.email, passwordHash, role: input.role },
  });
  revalidatePath("/admin/staff");
}

export async function updateStaffRole(userId: string, role: Role) {
  const session = await requireSession();
  requireRole(session, ["ADMIN"]);
  await prisma.user.update({ where: { id: userId }, data: { role } });
  revalidatePath("/admin/staff");
}

export async function resetStaffPassword(userId: string, newPassword: string) {
  const session = await requireSession();
  requireRole(session, ["ADMIN"]);
  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  revalidatePath("/admin/staff");
}

export async function deleteStaffUser(userId: string) {
  const session = await requireSession();
  requireRole(session, ["ADMIN"]);
  if (userId === session.id) {
    throw new Error("You can't delete your own account while signed in as it.");
  }
  await prisma.user.delete({ where: { id: userId } });
  revalidatePath("/admin/staff");
}
