"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateBookingStatus } from "../../actions";
import type { BookingStatus } from "@prisma/client";

const NEXT_STATUS: Record<BookingStatus, BookingStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["OUT", "CANCELLED"],
  OUT: ["RETURNED"],
  RETURNED: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
};

const LABEL: Record<BookingStatus, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirm",
  OUT: "Mark out / delivered",
  RETURNED: "Mark returned",
  COMPLETED: "Mark completed",
  CANCELLED: "Cancel booking",
};

export default function BookingStatusActions({
  bookingId,
  status,
}: {
  bookingId: string;
  status: BookingStatus;
}) {
  const [pending, startTransition] = useTransition();
  const [needsOverride, setNeedsOverride] = useState(false);
  const router = useRouter();
  const options = NEXT_STATUS[status];

  function attempt(next: BookingStatus, overrideAgreement?: boolean) {
    startTransition(async () => {
      const result = await updateBookingStatus(bookingId, next, { overrideAgreement });
      if (!result.ok) {
        setNeedsOverride(true);
        return;
      }
      setNeedsOverride(false);
      router.refresh();
    });
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

      {needsOverride && (
        <div className="mt-3 flex flex-wrap items-center gap-3 rounded-lg border border-amber/40 bg-amber/10 px-4 py-3 text-sm">
          <span className="text-amber-deep">
            No signed agreement on file — confirming anyway requires an admin override.
          </span>
          <button
            disabled={pending}
            onClick={() => attempt("CONFIRMED", true)}
            className="rounded-full border border-amber-deep/40 px-3 py-1.5 text-xs font-semibold text-amber-deep hover:bg-amber/20 disabled:opacity-50"
          >
            Confirm anyway (override)
          </button>
        </div>
      )}
    </div>
  );
}
