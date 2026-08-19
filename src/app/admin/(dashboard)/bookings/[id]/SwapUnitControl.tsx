"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { getSwapCandidates, swapBookingUnit } from "../../actions";
import { ArrowLeftRight, Loader2 } from "lucide-react";

export default function SwapUnitControl({
  bookingUnitId,
  canSwap,
}: {
  bookingUnitId: string;
  canSwap: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [candidates, setCandidates] = useState<{ id: string; serialNumber: string }[] | null>(null);
  const [selected, setSelected] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!canSwap) return null;

  function handleOpen() {
    setOpen(true);
    setError(null);
    startTransition(async () => {
      const result = await getSwapCandidates(bookingUnitId);
      setCandidates(result);
      setSelected(result[0]?.id ?? "");
    });
  }

  function handleConfirm() {
    if (!selected) return;
    setError(null);
    startTransition(async () => {
      const result = await swapBookingUnit(bookingUnitId, selected);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setOpen(false);
      setCandidates(null);
      router.refresh();
    });
  }

  if (!open) {
    return (
      <button
        onClick={handleOpen}
        className="flex items-center gap-1 text-xs font-semibold text-signal hover:underline"
      >
        <ArrowLeftRight className="h-3 w-3" /> Swap
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {candidates === null ? (
        <span className="flex items-center gap-1.5 text-xs text-steel">
          <Loader2 className="h-3 w-3 animate-spin" /> Checking availability…
        </span>
      ) : candidates.length === 0 ? (
        <span className="text-xs text-steel">No other units of this item are free for this window.</span>
      ) : (
        <>
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="rounded border border-line px-2 py-1 text-xs"
          >
            {candidates.map((c) => (
              <option key={c.id} value={c.id}>
                {c.serialNumber}
              </option>
            ))}
          </select>
          <button
            disabled={pending}
            onClick={handleConfirm}
            className="rounded bg-signal px-2.5 py-1 text-xs font-semibold text-white hover:brightness-110 disabled:opacity-50"
          >
            Confirm
          </button>
        </>
      )}
      <button
        onClick={() => {
          setOpen(false);
          setCandidates(null);
          setError(null);
        }}
        className="text-xs font-medium text-steel hover:text-navy"
      >
        Cancel
      </button>
      {error && <p className="w-full text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}
