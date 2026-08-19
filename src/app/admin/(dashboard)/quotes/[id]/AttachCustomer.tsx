"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateQuoteDetails } from "../actions";
import type { QuoteStatus } from "@prisma/client";

export default function AttachCustomer({
  quoteId,
  status,
  customers,
}: {
  quoteId: string;
  status: QuoteStatus;
  customers: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [customerId, setCustomerId] = useState("");

  function handleAttach() {
    if (!customerId) return;
    startTransition(async () => {
      await updateQuoteDetails(quoteId, { status, customerId });
      router.refresh();
    });
  }

  return (
    <div className="rounded-2xl border border-amber/40 bg-amber/10 p-4">
      <p className="text-sm font-semibold text-amber-deep">No customer attached yet.</p>
      <div className="mt-2 flex gap-2">
        <select
          value={customerId}
          onChange={(e) => setCustomerId(e.target.value)}
          className="flex-1 rounded border border-line px-2 py-1.5 text-sm"
        >
          <option value="">Select a customer…</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <button
          disabled={pending || !customerId}
          onClick={handleAttach}
          className="rounded bg-navy px-3 py-1.5 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-50"
        >
          Attach
        </button>
      </div>
    </div>
  );
}
