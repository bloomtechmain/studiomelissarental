"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { rescheduleBooking } from "../../actions";

export default function RescheduleForm({
  bookingId,
  currentDate,
  currentTime,
}: {
  bookingId: string;
  currentDate: string;
  currentTime: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(currentDate);
  const [time, setTime] = useState(currentTime);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await rescheduleBooking(bookingId, { pickupAt: `${date}T${time}` });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-full border border-line px-4 py-2 text-sm font-semibold text-navy hover:border-signal"
      >
        Reschedule
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-2 rounded-lg border border-line bg-paper p-3">
      <label className="flex flex-col gap-1 text-xs font-medium text-navy">
        New pickup date
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded border border-line px-2 py-1.5 text-sm" />
      </label>
      <label className="flex flex-col gap-1 text-xs font-medium text-navy">
        New pickup time
        <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="rounded border border-line px-2 py-1.5 text-sm" />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-navy px-3 py-1.5 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-50"
      >
        {pending ? "Checking…" : "Confirm reschedule"}
      </button>
      <button type="button" onClick={() => setOpen(false)} className="text-sm text-steel hover:text-navy">
        Cancel
      </button>
      {error && <p className="w-full text-sm font-medium text-red-600">{error}</p>}
    </form>
  );
}
