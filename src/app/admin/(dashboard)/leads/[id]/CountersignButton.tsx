"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { countersignLeadAsCompany } from "../actions";
import { FileCheck2 } from "lucide-react";

export default function CountersignButton({
  leadId,
  disabled,
}: {
  leadId: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      try {
        await countersignLeadAsCompany(leadId);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not countersign.");
      }
    });
  }

  return (
    <div className="mt-2">
      <button
        type="button"
        disabled={disabled || pending}
        onClick={handleClick}
        className="flex items-center gap-1.5 rounded-full bg-navy px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <FileCheck2 className="h-3.5 w-3.5" />
        {pending ? "Countersigning…" : "Countersign as Company"}
      </button>
      {error && <p className="mt-1.5 text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}
