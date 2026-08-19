import { differenceInCalendarDays } from "date-fns";

export type CancellationTier = "14_PLUS" | "7_TO_13" | "UNDER_7";

export type CancellationRefund = {
  daysUntilEvent: number;
  tier: CancellationTier;
  tierLabel: string;
  bookingFeeAmount: number;
  rentalFeeRefund: number;
  depositRefund: number;
  totalRefund: number;
};

// Section 4 of the rental agreement — the tiered cancellation policy.
// This is informational: it surfaces the policy's suggested refund to
// staff at cancellation time, it does not move any money itself (no
// payment processor is wired up).
export function computeCancellationRefund(args: {
  startAt: Date;
  rentalFee: number;
  securityDeposit: number;
  bookingFeePercent: number;
  now?: Date;
}): CancellationRefund {
  const { startAt, rentalFee, securityDeposit, bookingFeePercent, now = new Date() } = args;
  const daysUntilEvent = differenceInCalendarDays(startAt, now);
  const bookingFeeAmount = round2(rentalFee * (bookingFeePercent / 100));

  let tier: CancellationTier;
  let rentalFeeRefund: number;
  if (daysUntilEvent >= 14) {
    tier = "14_PLUS";
    rentalFeeRefund = round2(Math.max(0, rentalFee - bookingFeeAmount));
  } else if (daysUntilEvent >= 7) {
    tier = "7_TO_13";
    rentalFeeRefund = round2(Math.max(0, rentalFee * 0.5 - bookingFeeAmount));
  } else {
    tier = "UNDER_7";
    rentalFeeRefund = 0;
  }

  const tierLabel =
    tier === "14_PLUS"
      ? "14+ days before event — full refund minus booking fee"
      : tier === "7_TO_13"
        ? "7–13 days before event — 50% refund minus booking fee"
        : "Under 7 days before event — rental fee non-refundable";

  const depositRefund = round2(securityDeposit);

  return {
    daysUntilEvent,
    tier,
    tierLabel,
    bookingFeeAmount,
    rentalFeeRefund,
    depositRefund,
    totalRefund: round2(rentalFeeRefund + depositRefund),
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
