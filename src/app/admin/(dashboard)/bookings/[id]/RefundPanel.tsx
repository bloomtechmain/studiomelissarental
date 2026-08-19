"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateBookingRefund } from "../../actions";

export default function RefundPanel({
  bookingId,
  refundIssued,
  refundNote,
  suggestedRefund,
}: {
  bookingId: string;
  refundIssued: number;
  refundNote: string | null;
  suggestedRefund: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [amount, setAmount] = useState(String(refundIssued || suggestedRefund));
  const [note, setNote] = useState(refundNote ?? "");
  const [saved, setSaved] = useState(false);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaved(false);
    startTransition(async () => {
      await updateBookingRefund(bookingId, { refundIssued: Number(amount), refundNote: note });
      setSaved(true);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSave} className="rounded-2xl border border-line bg-white p-5 shadow-sm">
      <h2 className="font-semibold text-navy">Refund issued</h2>
      <div className="mt-3 grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1 text-sm font-medium text-navy">
          Amount refunded ($)
          <input
            type="number"
            min={0}
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="rounded border border-line px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-navy">
          Note
          <input value={note} onChange={(e) => setNote(e.target.value)} className="rounded border border-line px-3 py-2" />
        </label>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="w-fit rounded-full bg-navy px-5 py-2 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-50"
        >
          {pending ? "Saving…" : "Record refund"}
        </button>
        {saved && !pending && <span className="text-sm text-signal">Saved.</span>}
      </div>
    </form>
  );
}
