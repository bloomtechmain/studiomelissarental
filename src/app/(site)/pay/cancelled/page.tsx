import { XCircle } from "lucide-react";

export default function PaymentCancelledPage() {
  return (
    <div className="mx-auto max-w-lg px-6 py-24 text-center">
      <XCircle className="mx-auto h-12 w-12 text-steel" strokeWidth={1.75} />
      <h1 className="mt-4 font-display text-2xl font-semibold text-navy">Payment cancelled</h1>
      <p className="mt-2 text-steel">
        No payment was made. If this was a mistake, contact us and we&apos;ll send a new payment
        link.
      </p>
    </div>
  );
}
