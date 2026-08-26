"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { createStripePaymentLink } from "../../actions";
import type { StripePaymentStatus } from "@prisma/client";

const STATUS_LABEL: Record<StripePaymentStatus, string> = {
  PENDING: "Awaiting payment",
  COMPLETED: "Paid",
  FAILED: "Failed",
  CANCELLED: "Expired / cancelled",
};

const STATUS_COLOR: Record<StripePaymentStatus, string> = {
  PENDING: "text-amber-deep",
  COMPLETED: "text-signal",
  FAILED: "text-red-700",
  CANCELLED: "text-steel",
};

export default function OnlinePaymentPanel({
  bookingId,
  balanceDue,
  bookingFeeAmount,
  amountPaid,
  payments,
}: {
  bookingId: string;
  balanceDue: number;
  bookingFeeAmount: number;
  amountPaid: number;
  payments: {
    id: string;
    amount: number;
    status: StripePaymentStatus;
    createdAt: Date;
  }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  // Contract requires the non-refundable booking fee to be collected first,
  // at signing, with the rest of the balance due later (see rental
  // agreement Section 3) — default to whichever of those two is still
  // outstanding instead of always requesting the full balance.
  const bookingFeeOutstanding = Math.max(Math.round((bookingFeeAmount - amountPaid) * 100) / 100, 0);
  const defaultAmount = bookingFeeOutstanding > 0 ? bookingFeeOutstanding : Math.max(balanceDue, 0);
  const [amount, setAmount] = useState(String(defaultAmount));
  const [link, setLink] = useState<string | null>(null);
  const [emailStatus, setEmailStatus] = useState<{
    sent: boolean;
    reason?: "no_email_on_file" | "not_configured" | "send_failed";
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLink(null);
    setEmailStatus(null);
    setCopied(false);
    startTransition(async () => {
      try {
        const result = await createStripePaymentLink(bookingId, Number(amount), window.location.origin);
        setLink(result.url);
        setEmailStatus({ sent: result.emailSent, reason: result.emailSkippedReason });
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not create payment link.");
      }
    });
  }

  function handleCopy() {
    if (!link) return;
    navigator.clipboard.writeText(link);
    setCopied(true);
  }

  return (
    <section className="rounded-2xl border border-line bg-white p-5 shadow-sm sm:col-span-2">
      <h2 className="font-semibold text-navy">Online payment (Stripe)</h2>
      <p className="mt-1 text-xs text-steel">
        Creates a Stripe-hosted payment link and emails it straight to the customer. Once they
        pay, Stripe confirms it via webhook and the amount is added to &quot;Amount paid so
        far&quot; automatically.
      </p>

      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        {bookingFeeOutstanding > 0 && (
          <button
            type="button"
            onClick={() => setAmount(String(bookingFeeOutstanding))}
            className="rounded-full border border-line px-3 py-1 font-semibold text-navy hover:border-signal/60"
          >
            Booking fee (${bookingFeeOutstanding.toFixed(2)})
          </button>
        )}
        <button
          type="button"
          onClick={() => setAmount(String(Math.max(balanceDue, 0)))}
          className="rounded-full border border-line px-3 py-1 font-semibold text-navy hover:border-signal/60"
        >
          Full balance (${Math.max(balanceDue, 0).toFixed(2)})
        </button>
      </div>

      <form onSubmit={handleCreate} className="mt-3 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm font-medium text-navy">
          Amount to request ($)
          <input
            type="number"
            min={0.01}
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-40 rounded border border-line px-3 py-2"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-signal px-5 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
        >
          {pending ? "Creating…" : "Create payment link"}
        </button>
      </form>
      {bookingFeeOutstanding > 0 && (
        <p className="mt-1 text-xs text-steel">
          Contract requires the booking fee first, at signing — the balance isn&apos;t due until 3
          days before the event.
        </p>
      )}

      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}

      {emailStatus && (
        <p className={`mt-2 text-sm ${emailStatus.sent ? "text-signal" : "text-amber-deep"}`}>
          {emailStatus.sent
            ? "Emailed to the customer."
            : emailStatus.reason === "no_email_on_file"
              ? "No email on file for this customer — copy the link below and send it manually."
              : emailStatus.reason === "not_configured"
                ? "Email sending isn't set up yet — copy the link below and send it manually."
                : "Couldn't send the email — copy the link below and send it manually."}
        </p>
      )}

      {link && (
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-line bg-paper px-3 py-2">
          <a href={link} target="_blank" rel="noreferrer" className="truncate text-sm text-signal">
            {link}
          </a>
          <button
            type="button"
            onClick={handleCopy}
            className="ml-auto shrink-0 rounded-full border border-line bg-white px-3 py-1 text-xs font-semibold text-navy hover:border-signal/60"
          >
            {copied ? "Copied" : "Copy link"}
          </button>
        </div>
      )}

      {payments.length > 0 && (
        <ul className="mt-4 space-y-1.5 border-t border-line pt-3 text-sm">
          {payments.map((p) => (
            <li key={p.id} className="flex justify-between">
              <span className="text-steel">{format(p.createdAt, "MMM d, yyyy h:mm a")}</span>
              <span className="text-navy">${p.amount.toFixed(2)}</span>
              <span className={`font-medium ${STATUS_COLOR[p.status]}`}>{STATUS_LABEL[p.status]}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
