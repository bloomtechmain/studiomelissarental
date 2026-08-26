"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateBookingFinancials } from "../../actions";
import SectionHeader from "@/components/admin/SectionHeader";
import { Wallet } from "lucide-react";
import type { PaymentMethod, BookingStatus } from "@prisma/client";

const METHODS: PaymentMethod[] = ["CASH", "CHECK", "CARD", "BANK_TRANSFER", "OTHER"];
const METHOD_LABEL: Record<PaymentMethod, string> = {
  CASH: "Cash",
  CHECK: "Check",
  CARD: "Card",
  BANK_TRANSFER: "Bank transfer",
  OTHER: "Other",
};

export default function PaymentPanel({
  bookingId,
  bookingFeePercent,
  rentalFee,
  securityDeposit,
  amountPaid,
  paymentMethod,
  chargesTotal,
  status,
  depositOverridden,
}: {
  bookingId: string;
  bookingFeePercent: number;
  rentalFee: number;
  securityDeposit: number;
  amountPaid: number;
  paymentMethod: PaymentMethod | null;
  chargesTotal: number;
  status: BookingStatus;
  depositOverridden: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [fee, setFee] = useState(String(rentalFee));
  const [deposit, setDeposit] = useState(String(securityDeposit));
  const [paid, setPaid] = useState(String(amountPaid));
  const [method, setMethod] = useState<PaymentMethod | "">(paymentMethod ?? "");

  const feeNum = Number(fee) || 0;
  const depositNum = Number(deposit) || 0;
  const paidNum = Number(paid) || 0;
  const bookingFeeAmount = Math.round(feeNum * (bookingFeePercent / 100) * 100) / 100;
  const balanceDue = Math.round((feeNum + depositNum + chargesTotal - paidNum) * 100) / 100;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaved(false);
    startTransition(async () => {
      await updateBookingFinancials(bookingId, {
        rentalFee: feeNum,
        securityDeposit: depositNum,
        amountPaid: paidNum,
        paymentMethod: method || null,
      });
      setSaved(true);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-line bg-white p-5 shadow-sm">
      <SectionHeader icon={Wallet}>Payment</SectionHeader>
      <div className="mt-3 grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1 text-sm font-medium text-navy">
          Rental fee ($)
          <input
            type="number"
            min={0}
            step="0.01"
            value={fee}
            onChange={(e) => setFee(e.target.value)}
            className="rounded border border-line px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-navy">
          Security deposit ($)
          <input
            type="number"
            min={0}
            step="0.01"
            value={deposit}
            onChange={(e) => setDeposit(e.target.value)}
            className="rounded border border-line px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-navy">
          Amount paid so far ($)
          <input
            type="number"
            min={0}
            step="0.01"
            value={paid}
            onChange={(e) => setPaid(e.target.value)}
            className="rounded border border-line px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-navy">
          Payment method
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value as PaymentMethod)}
            className="rounded border border-line px-3 py-2"
          >
            <option value="">— not set —</option>
            {METHODS.map((m) => (
              <option key={m} value={m}>
                {METHOD_LABEL[m]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <dl className="mt-4 space-y-1.5 border-t border-line pt-4 text-sm">
        <div className="flex justify-between">
          <dt className="text-steel">Booking fee ({bookingFeePercent}% — non-refundable)</dt>
          <dd className="font-medium text-navy">${bookingFeeAmount.toFixed(2)}</dd>
        </div>
        {chargesTotal !== 0 && (
          <div className="flex justify-between">
            <dt className="text-steel">Add-ons / discounts</dt>
            <dd className="font-medium text-navy">${chargesTotal.toFixed(2)}</dd>
          </div>
        )}
        <div className="flex justify-between">
          <dt className="text-steel">Balance due</dt>
          <dd className={`font-semibold ${balanceDue > 0 ? "text-amber-deep" : "text-navy"}`}>
            ${balanceDue.toFixed(2)}
          </dd>
        </div>
        {depositOverridden && balanceDue > 0 && ["CONFIRMED", "PAID_IN_FULL"].includes(status) && (
          <p className="text-xs font-medium text-amber-deep">
            Moved to {status === "PAID_IN_FULL" ? "Paid in full" : "Confirmed"} with a balance still
            outstanding — admin override on record.
          </p>
        )}
      </dl>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="w-fit rounded-full bg-navy px-5 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save"}
        </button>
        {saved && !pending && <span className="text-sm text-signal">Saved.</span>}
      </div>
    </form>
  );
}
