"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  addQuoteLine,
  removeQuoteLine,
  updateQuoteDetails,
  convertQuoteToBooking,
  getOrCreateShareLink,
} from "../actions";
import type { QuoteStatus } from "@prisma/client";
import { Trash2, Link2, Check, Copy } from "lucide-react";

type Line = { id: string; description: string; quantity: number; unitPrice: number };
type AddOn = { id: string; name: string; price: number };

const STATUSES: QuoteStatus[] = ["DRAFT", "SENT", "ACCEPTED", "EXPIRED", "DECLINED"];

export default function QuoteEditor({
  quoteId,
  status,
  lines,
  hasCustomer,
  shareToken,
  addOns,
}: {
  quoteId: string;
  status: QuoteStatus;
  lines: Line[];
  hasCustomer: boolean;
  shareToken: string | null;
  addOns: AddOn[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [desc, setDesc] = useState("");
  const [qty, setQty] = useState(1);
  const [price, setPrice] = useState("0");
  const [convertError, setConvertError] = useState<string | null>(null);
  const [converted, setConverted] = useState<string | null>(null);
  const [token, setToken] = useState(shareToken);
  const [linkPending, setLinkPending] = useState(false);
  const [copied, setCopied] = useState(false);

  function applyAddOn(id: string) {
    const addOn = addOns.find((a) => a.id === id);
    if (addOn) {
      setDesc(addOn.name);
      setPrice(String(addOn.price));
    }
  }

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

  function handleGetLink() {
    setLinkPending(true);
    startTransition(async () => {
      const t = await getOrCreateShareLink(quoteId);
      setToken(t);
      setLinkPending(false);
    });
  }

  function handleCopy(url: string) {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const shareUrl = token && typeof window !== "undefined" ? `${window.location.origin}/q/${token}` : null;
  const total = lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);

  return (
    <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center gap-2 rounded-lg border border-line bg-paper/60 px-3.5 py-3">
        <Link2 className="h-4 w-4 shrink-0 text-signal" strokeWidth={2.25} />
        {shareUrl ? (
          <>
            <input
              readOnly
              value={shareUrl}
              onFocus={(e) => e.target.select()}
              className="min-w-0 flex-1 truncate bg-transparent text-sm text-navy outline-none"
            />
            <button
              onClick={() => handleCopy(shareUrl)}
              className="flex shrink-0 items-center gap-1 rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold text-navy hover:border-signal"
            >
              {copied ? <Check className="h-3 w-3 text-signal" /> : <Copy className="h-3 w-3" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </>
        ) : (
          <>
            <p className="flex-1 text-sm text-steel">No shareable link yet — customers can&apos;t view this quote without one.</p>
            <button
              onClick={handleGetLink}
              disabled={linkPending}
              className="shrink-0 rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold text-navy hover:border-signal disabled:opacity-50"
            >
              {linkPending ? "Generating…" : "Get shareable link"}
            </button>
          </>
        )}
      </div>

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

      {addOns.length > 0 && (
        <select
          onChange={(e) => e.target.value && applyAddOn(e.target.value)}
          defaultValue=""
          className="mt-4 w-full rounded border border-line px-2 py-1.5 text-sm"
        >
          <option value="">Add from add-on list…</option>
          {addOns.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name} — ${a.price.toFixed(2)}
            </option>
          ))}
        </select>
      )}

      <div className="mt-2 flex items-end gap-2 border-t border-line pt-4">
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
