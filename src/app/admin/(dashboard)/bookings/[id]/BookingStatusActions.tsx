"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateBookingStatus } from "../../actions";
import type { BookingStatus } from "@prisma/client";

// Confirmed can only advance to Paid in full (not straight to Out) — the
// rental agreement has the balance due before delivery, so this forces that
// checkpoint rather than letting equipment go out unpaid.
const NEXT_STATUS: Record<BookingStatus, BookingStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PAID_IN_FULL", "CANCELLED"],
  PAID_IN_FULL: ["OUT", "CANCELLED"],
  OUT: ["RETURNED"],
  RETURNED: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
};

const LABEL: Record<BookingStatus, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirm",
  PAID_IN_FULL: "Mark paid in full",
  OUT: "Mark out / delivered",
  RETURNED: "Mark returned",
  COMPLETED: "Mark completed",
  CANCELLED: "Cancel booking",
};

type GateCode = "AGREEMENT_REQUIRED" | "DEPOSIT_REQUIRED" | "BALANCE_REMAINING";

const GATE_MESSAGE: Record<GateCode, string> = {
  AGREEMENT_REQUIRED: "No signed agreement on file — confirming anyway requires an admin override.",
  DEPOSIT_REQUIRED: "The non-refundable booking fee hasn't been recorded as paid yet — confirming anyway requires an admin override.",
  BALANCE_REMAINING: "There's still a balance due — marking this paid in full anyway requires an admin override.",
};

export default function BookingStatusActions({
  bookingId,
  status,
}: {
  bookingId: string;
  status: BookingStatus;
}) {
  const [pending, startTransition] = useTransition();
  const [gate, setGate] = useState<{ code: GateCode; target: BookingStatus } | null>(null);
  const router = useRouter();
  const options = NEXT_STATUS[status];

  function attempt(next: BookingStatus, overrides?: { overrideAgreement?: boolean; overridePayment?: boolean }) {
    startTransition(async () => {
      const result = await updateBookingStatus(bookingId, next, overrides);
      if (!result.ok) {
        setGate({ code: result.code, target: next });
        return;
      }
      setGate(null);
      router.refresh();
    });
  }

  function overrideAndRetry() {
    if (!gate) return;
    const overrides =
      gate.code === "AGREEMENT_REQUIRED" ? { overrideAgreement: true } : { overridePayment: true };
    attempt(gate.target, overrides);
  }

  if (options.length === 0) return null;

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {options.map((next) => (
          <button
            key={next}
            disabled={pending}
            onClick={() => attempt(next)}
            className={`rounded px-4 py-2 text-sm font-semibold disabled:opacity-50 ${
              next === "CANCELLED"
                ? "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                : "bg-navy text-white hover:brightness-110"
            }`}
          >
            {LABEL[next]}
          </button>
        ))}
      </div>

      {gate && (
        <div className="mt-3 flex flex-wrap items-center gap-3 rounded-lg border border-amber/40 bg-amber/10 px-4 py-3 text-sm">
          <span className="text-amber-deep">{GATE_MESSAGE[gate.code]}</span>
          <button
            disabled={pending}
            onClick={overrideAndRetry}
            className="rounded-full border border-amber-deep/40 px-3 py-1.5 text-xs font-semibold text-amber-deep hover:bg-amber/20 disabled:opacity-50"
          >
            {LABEL[gate.target]} anyway (override)
          </button>
        </div>
      )}
    </div>
  );
}
