import { CheckCircle2 } from "lucide-react";

export default function PaymentSuccessPage() {
  return (
    <div className="mx-auto max-w-lg px-6 py-24 text-center">
      <CheckCircle2 className="mx-auto h-12 w-12 text-signal" strokeWidth={1.75} />
      <h1 className="mt-4 font-display text-2xl font-semibold text-navy">Payment received</h1>
      <p className="mt-2 text-steel">
        Thank you — your payment has gone through. Our team will confirm it against your booking
        shortly; you don&apos;t need to do anything else.
      </p>
    </div>
  );
}
