import { prisma } from "@/lib/prisma";

const DEFAULT_BUFFER_HOURS = 3;
// Section 3 of the rental agreement: "a non-refundable booking fee of 25%
// of the rental fee is due at signing." Kept as data, not hardcoded, since
// the agreement itself could be revised.
const DEFAULT_BOOKING_FEE_PERCENT = 25;

export async function getGlobalBufferHours(): Promise<number> {
  const row = await prisma.setting.findUnique({ where: { key: "bufferHours" } });
  if (!row) return DEFAULT_BUFFER_HOURS;
  const n = Number(row.value);
  return Number.isFinite(n) && n >= 0 ? n : DEFAULT_BUFFER_HOURS;
}

export async function setGlobalBufferHours(hours: number): Promise<void> {
  await prisma.setting.upsert({
    where: { key: "bufferHours" },
    update: { value: String(hours) },
    create: { key: "bufferHours", value: String(hours) },
  });
}

export async function getBookingFeePercent(): Promise<number> {
  const row = await prisma.setting.findUnique({ where: { key: "bookingFeePercent" } });
  if (!row) return DEFAULT_BOOKING_FEE_PERCENT;
  const n = Number(row.value);
  return Number.isFinite(n) && n >= 0 && n <= 100 ? n : DEFAULT_BOOKING_FEE_PERCENT;
}

export async function setBookingFeePercent(percent: number): Promise<void> {
  await prisma.setting.upsert({
    where: { key: "bookingFeePercent" },
    update: { value: String(percent) },
    create: { key: "bookingFeePercent", value: String(percent) },
  });
}

export async function getCompanySignatureUrl(): Promise<string | null> {
  const row = await prisma.setting.findUnique({ where: { key: "companySignatureUrl" } });
  return row?.value ?? null;
}
