"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addQuoteLine, removeQuoteLine, updateQuoteDetails, convertQuoteToBooking } from "../actions";
import type { QuoteStatus } from "@prisma/client";
import { Trash2 } from "lucide-react";

type Line = { id: string; description: string; quantity: number; unitPrice: number };

const STATUSES: QuoteStatus[] = ["DRAFT", "SENT", "ACCEPTED", "EXPIRED", "DECLINED"];

export default function QuoteEditor({
  quoteId,
  status,
  lines,
  hasCustomer,
}: {
  quoteId: string;
  status: QuoteStatus;
  lines: Line[];
  hasCustomer: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [desc, setDesc] = useState("");
  const [qty, setQty] = useState(1);
  const [price, setPrice] = useState("0");
  const [convertError, setConvertError] = useState<string | null>(null);
  const [converted, setConverted] = useState<string | null>(null);

  function handleAddLine() {
    if (!desc.trim()) return;
    startTransition(async () => {
      await addQuoteLine(quoteId, { description: desc.trim(), quantity: qty, unitPrice: Number(price) });
      setDesc("");
      setQty(1);
      setPrice("0");
      router.refresh();
    });
  }

  function handleRemoveLine(lineId: string) {
    startTransition(async () => {
      await removeQuoteLine(lineId, quoteId);
      router.refresh();
    });
  }

  function handleStatusChange(next: QuoteStatus) {
    startTransition(async () => {
      await updateQuoteDetails(quoteId, { status: next });
      router.refresh();
    });
  }

  function handleConvert() {
    setConvertError(null);
    startTransition(async () => {
      const result = await convertQuoteToBooking(quoteId);
      if (!result.ok) {
        setConvertError(result.error);
        return;
      }
      setConverted(result.bookingId);
      router.refresh();
    });
  }

  const total = lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);

  return (
    <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-navy">Line items</h2>
        <select
          value={status}
          disabled={pending}
          onChange={(e) => handleStatusChange(e.target.value as QuoteStatus)}
          className="rounded border border-line px-2 py-1 text-sm"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <table className="mt-3 w-full text-sm">
        <tbody className="divide-y divide-line">
          {lines.map((l) => (
            <tr key={l.id}>
              <td className="py-2 text-navy">{l.description}</td>
              <td className="py-2 text-center text-steel">{l.quantity}×</td>
              <td className="py-2 text-right text-steel">${l.unitPrice.toFixed(2)}</td>
              <td className="py-2 text-right font-medium text-navy">
                ${(l.quantity * l.unitPrice).toFixed(2)}
              </td>
              <td className="py-2 pl-2">
                <button onClick={() => handleRemoveLine(l.id)} className="text-steel hover:text-red-600">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-line font-semibold">
            <td colSpan={3} className="py-2 text-navy">
              Total
            </td>
            <td className="py-2 text-right text-navy">${total.toFixed(2)}</td>
            <td />
          </tr>
        </tfoot>
      </table>

      <div className="mt-4 flex items-end gap-2 border-t border-line pt-4">
        <label className="flex flex-1 flex-col gap-1 text-xs font-medium text-navy">
          Description
          <input value={desc} onChange={(e) => setDesc(e.target.value)} className="rounded border border-line px-2 py-1.5 text-sm" />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-navy">
          Qty
          <input type="number" value={qty} onChange={(e) => setQty(Number(e.target.value))} className="w-16 rounded border border-line px-2 py-1.5 text-sm" />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-navy">
          Unit price ($, negative = discount)
          <input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} className="w-32 rounded border border-line px-2 py-1.5 text-sm" />
        </label>
        <button
          disabled={pending}
          onClick={handleAddLine}
          className="rounded-full bg-navy px-4 py-1.5 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-50"
        >
          Add line
        </button>
      </div>

      <div className="mt-5 border-t border-line pt-4">
        {converted ? (
          <p className="text-sm font-semibold text-signal">
            Converted — <a href={`/admin/bookings/${converted}`} className="underline">view booking →</a>
          </p>
        ) : (
          <button
            disabled={pending || !hasCustomer}
            onClick={handleConvert}
            className="rounded-full bg-amber px-5 py-2.5 text-sm font-semibold text-amber-deep hover:brightness-95 disabled:opacity-50"
          >
            Convert to booking
          </button>
        )}
        {!hasCustomer && !converted && (
          <p className="mt-2 text-xs text-steel">Attach a customer to this quote first.</p>
        )}
        {convertError && <p className="mt-2 text-sm font-medium text-red-600">{convertError}</p>}
      </div>
    </div>
  );
}
