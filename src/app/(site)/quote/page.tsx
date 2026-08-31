import Image from "next/image";
import Link from "next/link";
import {
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  ClipboardList,
  FileCheck2,
  MessageSquareText,
  Zap,
} from "lucide-react";
import QuoteRequestForm from "@/components/QuoteRequestForm";

const whatToInclude = [
  "Event date(s) and approximate start/end time",
  "Venue name or address (and whether it's indoor or outdoor)",
  "Estimated guest count",
  "Type of event (wedding, corporate, festival, etc.)",
  "Power available on-site (standard outlets vs. generator)",
  "Any specific equipment or brands you'd like to use",
  "Whether you'd like an on-site technician for the event",
];

const whatHappensNext = [
  {
    icon: ClipboardList,
    text: "We review your event details and follow up with any clarifying questions.",
  },
  {
    icon: FileCheck2,
    text: "You'll receive a written quote with equipment, price, and delivery/pickup times.",
  },
  {
    icon: CheckCircle2,
    text: "Your quote is locked once confirmed — no surprise fees if your event plan doesn't change.",
  },
];

export default function QuotePage() {
  return (
    <div>
      <section className="relative isolate overflow-hidden bg-navy-dark">
        <Image
          src="/images/hero-stage.jpg"
          alt="Line-array PA stacks lit up on stage at dusk"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-navy-dark via-navy-dark/85 to-navy-dark/40" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-navy-dark/95 via-navy-dark/50 to-transparent" />

        <div className="relative mx-auto max-w-3xl px-6 py-14">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm font-semibold text-signal-light/80 transition hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" /> Back home
          </Link>

          <div className="mt-6 flex animate-fade-up items-start gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10 text-amber ring-1 ring-inset ring-white/15">
              <MessageSquareText className="h-5 w-5" strokeWidth={2.25} />
            </span>
            <div>
              <p className="tier-pill bg-white/10 text-amber ring-1 ring-inset ring-white/15">
                Free & no obligation
              </p>
              <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Request a quote
              </h1>
              <p className="mt-3 max-w-xl leading-relaxed text-signal-light/80">
                Have an event that doesn&apos;t fit one of our packages — a bigger guest count,
                a multi-day rental, an unusual venue, or a specific gear combination? Tell us
                about it and we&apos;ll put together a custom quote, usually within one business
                day.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="rounded-2xl border border-line bg-white p-6 shadow-sm">
            <h2 className="font-display text-base font-semibold text-navy">What to include</h2>
            <ul className="mt-3 space-y-2">
              {whatToInclude.map((line) => (
                <li key={line} className="flex items-start gap-2.5 text-sm text-steel">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-signal" />
                  {line}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-line bg-white p-6 shadow-sm">
            <h2 className="font-display text-base font-semibold text-navy">
              What happens next
            </h2>
            <ul className="mt-3 space-y-3.5">
              {whatHappensNext.map((step) => (
                <li key={step.text} className="flex items-start gap-2.5 text-sm text-steel">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-signal-light/60 text-signal">
                    <step.icon className="h-3 w-3" strokeWidth={2.5} />
                  </span>
                  {step.text}
                </li>
              ))}
            </ul>
            <p className="mt-3.5 flex items-start gap-2.5 text-sm font-semibold text-navy">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber/20 text-amber-deep">
                <Zap className="h-3 w-3" strokeWidth={2.5} />
              </span>
              Response time: usually within 1 business day.
            </p>
          </div>
        </div>

        <div className="mt-8">
          <QuoteRequestForm />
        </div>

        <p className="mt-6 flex items-center gap-1.5 text-xs text-steel">
          <CalendarClock className="h-3.5 w-3.5" />
          We&apos;ll follow up by email or phone — whichever you provide.
        </p>
      </div>
    </div>
  );
}
