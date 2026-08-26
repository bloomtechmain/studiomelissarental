import Link from "next/link";
import { ChevronRight, Clock, Package, Sparkles, Volume2 } from "lucide-react";

export default function HomePage() {
  return (
    <div>
      {/* ---------- Hero ---------- */}
      <section className="relative overflow-hidden border-b border-line bg-paper">
        <div className="bg-dot-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_70%_60%_at_30%_20%,black,transparent)]" />
        <div className="relative mx-auto grid max-w-6xl gap-12 px-6 py-20 lg:grid-cols-[1.1fr_0.9fr] lg:py-28">
          <div className="animate-fade-up">
            <p className="tier-pill">
              <Sparkles className="mr-1.5 -ml-0.5 h-3.5 w-3.5" strokeWidth={2.5} />
              Central Texas
            </p>
            <h1 className="mt-5 max-w-xl font-display text-5xl font-semibold leading-[1.05] tracking-tight text-navy sm:text-6xl">
              Sound gear sized to your room.
            </h1>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-steel">
              Browse our service packages or individual equipment, check live availability, and
              request your booking online.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/services"
                className="rounded-full bg-amber px-6 py-3 font-semibold text-amber-deep shadow-sm shadow-amber/30 transition hover:brightness-95 active:scale-[0.98]"
              >
                Browse services
              </Link>
              <Link
                href="/products"
                className="inline-flex items-center gap-1.5 rounded-full border border-line px-6 py-3 font-semibold text-navy transition hover:border-navy"
              >
                View products
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="flex items-center animate-fade-up [animation-delay:120ms]">
            <div className="bg-dot-grid-dark relative w-full overflow-hidden rounded-2xl border border-navy-dark bg-navy-dark p-8 shadow-xl shadow-navy/20">
              <p className="text-xs font-semibold uppercase tracking-wider text-signal-light/60">
                Book online in minutes
              </p>

              <div className="mt-5 flex items-end gap-1.5" aria-hidden>
                {[40, 65, 30, 80, 50, 95, 45, 70, 35, 60, 25, 55].map((h, i) => (
                  <div
                    key={i}
                    className="w-full rounded-full bg-gradient-to-t from-signal to-signal-light"
                    style={{
                      height: `${h}px`,
                      opacity: 0.35 + (i % 4) * 0.15,
                      animation: `fade-up 1.4s ease-in-out ${i * 90}ms infinite alternate`,
                    }}
                  />
                ))}
              </div>

              <div className="mt-7 space-y-3">
                <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-4 py-3">
                  <Clock className="h-4 w-4 shrink-0 text-signal-light" />
                  <div>
                    <p className="text-sm font-semibold text-white">Pick your own pickup time</p>
                    <p className="text-xs text-signal-light/60">Plenty of time to set up, host, and wrap</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-4 py-3">
                  <Clock className="h-4 w-4 shrink-0 text-signal-light" />
                  <div>
                    <p className="text-sm font-semibold text-white">Real-time availability</p>
                    <p className="text-xs text-signal-light/60">See exactly what&apos;s free before you book</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Teaser links ---------- */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="mx-auto max-w-lg text-center">
          <p className="tier-pill mx-auto">How it works</p>
          <h2 className="mt-4 font-display text-3xl font-semibold text-navy sm:text-4xl">
            Two ways to book
          </h2>
          <p className="mt-3 text-steel">
            Whichever path fits your event, delivery and pickup are handled the same way.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          <Link
            href="/services"
            className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-line bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:border-signal/40 hover:shadow-xl"
          >
            <Package
              className="pointer-events-none absolute -top-6 -right-6 h-32 w-32 text-signal-light/30 transition-transform duration-500 group-hover:rotate-6 group-hover:scale-110"
              strokeWidth={1}
              aria-hidden
            />
            <div className="relative">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-signal-light/40 text-signal">
                <Package className="h-6 w-6" strokeWidth={2.25} />
              </span>
              <h3 className="mt-5 font-display text-2xl font-semibold text-navy">Services</h3>
              <p className="mt-2 max-w-xs text-steel">
                Ready-to-book package tiers — we deliver, set up, and pick up.
              </p>
            </div>
            <span className="relative mt-8 inline-flex w-fit items-center gap-2 rounded-full border border-line bg-paper px-4 py-2 text-sm font-semibold text-navy transition group-hover:border-signal group-hover:text-signal">
              Browse services
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </span>
          </Link>

          <Link
            href="/products"
            className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-line bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:border-signal/40 hover:shadow-xl"
          >
            <Volume2
              className="pointer-events-none absolute -top-6 -right-6 h-32 w-32 text-signal-light/30 transition-transform duration-500 group-hover:rotate-6 group-hover:scale-110"
              strokeWidth={1}
              aria-hidden
            />
            <div className="relative">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-signal-light/40 text-signal">
                <Volume2 className="h-6 w-6" strokeWidth={2.25} />
              </span>
              <h3 className="mt-5 font-display text-2xl font-semibold text-navy">Products</h3>
              <p className="mt-2 max-w-xs text-steel">
                Individual equipment for your own build — pick it up from us.
              </p>
            </div>
            <span className="relative mt-8 inline-flex w-fit items-center gap-2 rounded-full border border-line bg-paper px-4 py-2 text-sm font-semibold text-navy transition group-hover:border-signal group-hover:text-signal">
              View products
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </span>
          </Link>
        </div>
      </section>
    </div>
  );
}
