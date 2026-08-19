"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateBufferHours, updateBookingFeePercent } from "../actions";

export default function SettingsForm({
  bufferHours,
  bookingFeePercent,
}: {
  bufferHours: number;
  bookingFeePercent: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [hours, setHours] = useState(String(bufferHours));
  const [feePercent, setFeePercent] = useState(String(bookingFeePercent));
  const [saved, setSaved] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaved(false);
    startTransition(async () => {
      await Promise.all([
        updateBufferHours(Number(hours)),
        updateBookingFeePercent(Number(feePercent)),
      ]);
      setSaved(true);
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-6 flex max-w-sm flex-col gap-5 rounded-2xl border border-line bg-white shadow-sm p-5"
    >
      <label className="flex flex-col gap-1 text-sm font-medium text-navy">
        Global buffer hours between bookings
        <input
          type="number"
          min={0}
          value={hours}
          onChange={(e) => setHours(e.target.value)}
          className="rounded border border-line px-3 py-2"
        />
        <span className="text-xs text-steel">
          Applies after a unit&apos;s scheduled return before it can be booked again, unless an
          item has its own override.
        </span>
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium text-navy">
        Booking fee (%)
        <input
          type="number"
          min={0}
          max={100}
          value={feePercent}
          onChange={(e) => setFeePercent(e.target.value)}
          className="rounded border border-line px-3 py-2"
        />
        <span className="text-xs text-steel">
          Non-refundable percentage of the rental fee due at signing to reserve a date, per the
          rental agreement.
        </span>
      </label>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="w-fit rounded-full bg-navy px-5 py-2.5 font-semibold text-white hover:brightness-110 disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save"}
        </button>
        {saved && !pending && <span className="text-sm text-signal">Saved.</span>}
      </div>
    </form>
  );
}
