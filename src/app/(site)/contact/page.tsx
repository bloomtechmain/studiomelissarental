import Link from "next/link";
import { Mail, Phone, MapPin, MessageSquareText } from "lucide-react";

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-display text-3xl font-semibold text-navy">Contact us</h1>
      <p className="mt-2 text-steel">
        Have a question, or need something not covered by our online booking? Reach out.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
          <Phone className="h-4 w-4 text-signal" strokeWidth={2.25} />
          <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-steel">Phone</p>
          <p className="mt-1 text-sm text-navy">To be added</p>
        </div>
        <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
          <Mail className="h-4 w-4 text-signal" strokeWidth={2.25} />
          <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-steel">Email</p>
          <p className="mt-1 text-sm text-navy">To be added</p>
        </div>
        <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
          <MapPin className="h-4 w-4 text-signal" strokeWidth={2.25} />
          <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-steel">Area served</p>
          <p className="mt-1 text-sm text-navy">Central Texas</p>
        </div>
      </div>

      <div className="mt-10 rounded-2xl border border-line bg-white p-7 shadow-sm">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-signal-light/50 text-signal">
            <MessageSquareText className="h-4 w-4" strokeWidth={2.25} />
          </span>
          <div>
            <h2 className="font-display text-lg font-semibold text-navy">Planning an event?</h2>
            <p className="text-sm text-steel">
              The fastest way to hear back is our quote request form — it goes straight to our
              team.
            </p>
          </div>
        </div>
        <Link
          href="/quote"
          className="mt-5 inline-flex w-fit items-center gap-1.5 rounded-full bg-navy px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
        >
          Request a quote
        </Link>
      </div>
    </div>
  );
}
