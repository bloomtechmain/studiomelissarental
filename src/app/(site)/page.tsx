import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import HeroVideoCarousel from "@/components/HeroVideoCarousel";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};
import {
  Briefcase,
  Building2,
  ChevronRight,
  Clock,
  FileCheck,
  Home,
  MapPin,
  MessageCircle,
  Package,
  PackageCheck,
  Sparkles,
  Target,
  Telescope,
  Truck,
  Volume2,
} from "lucide-react";

const bookingSteps = [
  {
    icon: MessageCircle,
    title: "Tell us the event",
    description: "Guest count, venue, indoor or outdoor.",
  },
  {
    icon: FileCheck,
    title: "Get a locked quote",
    description: "One price, no surprise add-ons if the plan doesn't change.",
  },
  {
    icon: Truck,
    title: "We deliver and set up",
    description: "Gear arrives tested and ready to go.",
  },
  {
    icon: PackageCheck,
    title: "We pick it up",
    description: "Breakdown and pickup are on us.",
  },
];

export default function HomePage() {
  return (
    <div>
      {/* ---------- Hero ---------- */}
      <section className="relative isolate overflow-hidden bg-navy-dark">
        <HeroVideoCarousel />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-navy-dark via-navy-dark/80 to-navy-dark/30" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-navy-dark/95 via-navy-dark/40 to-transparent" />

        <div className="relative mx-auto max-w-6xl px-6 pt-24 pb-36 sm:pt-32 sm:pb-44">
          <div className="max-w-xl animate-fade-up">
            <p className="tier-pill bg-white/10 text-amber ring-1 ring-inset ring-white/15">
              <Sparkles className="mr-1.5 -ml-0.5 h-3.5 w-3.5" strokeWidth={2.5} />
              Central Texas
            </p>
            <h1 className="mt-5 font-display text-5xl font-semibold leading-[1.05] tracking-tight text-white sm:text-6xl">
              Sound gear sized to your room.
            </h1>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-signal-light/80">
              Professional PA and audio equipment rental for homes, corporate events, and
              commercial productions across the Greater Austin area — delivered, set up, and
              picked up so you don&apos;t have to think about it.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/quote"
                className="rounded-full bg-amber px-6 py-3 font-semibold text-amber-deep shadow-sm shadow-amber/30 transition hover:brightness-95 active:scale-[0.98]"
              >
                Request a Quote
              </Link>
              <Link
                href="/services"
                className="inline-flex items-center gap-1.5 rounded-full border border-white/25 px-6 py-3 font-semibold text-white transition hover:border-white/60"
              >
                View Packages
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Floating stat strip, pulled up over the hero's bottom edge */}
      <div className="relative z-10 mx-auto -mt-10 max-w-6xl px-6 sm:-mt-12">
        <div className="grid divide-y divide-white/10 rounded-2xl border border-white/10 bg-navy/90 shadow-2xl shadow-navy-dark/40 backdrop-blur sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <div className="flex items-center gap-3 px-6 py-5">
            <Clock className="h-5 w-5 shrink-0 text-amber" strokeWidth={2.25} />
            <div>
              <p className="text-sm font-semibold text-white">Pick your own pickup time</p>
              <p className="text-xs text-signal-light/60">Plenty of time to set up, host, and wrap</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-6 py-5">
            <Sparkles className="h-5 w-5 shrink-0 text-amber" strokeWidth={2.25} />
            <div>
              <p className="text-sm font-semibold text-white">Real-time availability</p>
              <p className="text-xs text-signal-light/60">See exactly what&apos;s free before you book</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-6 py-5">
            <MapPin className="h-5 w-5 shrink-0 text-amber" strokeWidth={2.25} />
            <div>
              <p className="text-sm font-semibold text-white">Delivered &amp; set up</p>
              <p className="text-xs text-signal-light/60">Across the Greater Austin area</p>
            </div>
          </div>
        </div>
      </div>

      {/* ---------- Mission & Vision ---------- */}
      <section className="bg-dot-grid-dark relative overflow-hidden bg-navy-dark pt-16 pb-20 sm:pt-20">
        <div className="relative mx-auto grid max-w-6xl gap-x-10 gap-y-14 px-6 sm:grid-cols-2">
          <div>
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber/15 text-amber">
              <Target className="h-6 w-6" strokeWidth={2.25} />
            </span>
            <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-amber">
              Our mission
            </p>
            <h2 className="mt-2 font-display text-2xl font-semibold text-white sm:text-3xl">
              Professional sound, within reach
            </h2>
            <p className="mt-4 leading-relaxed text-signal-light/70">
              Studio Melissa Rental puts professional-grade sound within reach of everyday
              events — a backyard wedding, a company town hall, a weekend market stall. We match
              the system to the room, deliver it ready to run, and stay reachable until the last
              song ends and the truck is packed.
            </p>
          </div>
          <div>
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber/15 text-amber">
              <Telescope className="h-6 w-6" strokeWidth={2.25} />
            </span>
            <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-amber">
              Our vision
            </p>
            <h2 className="mt-2 font-display text-2xl font-semibold text-white sm:text-3xl">
              The first call across Central Texas
            </h2>
            <p className="mt-4 leading-relaxed text-signal-light/70">
              We&apos;re building toward being the first call for PA and audio production across
              Central Texas — known for gear maintained like it&apos;s going on tour, quotes that
              don&apos;t change after the fact, and a team that treats a backyard reception with
              the same care as a 500-guest gala.
            </p>
          </div>
        </div>
      </section>

      {/* ---------- What we do ---------- */}
      <section className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
        <div className="mx-auto max-w-lg text-center">
          <p className="tier-pill mx-auto">What we do</p>
          <h2 className="mt-4 font-display text-3xl font-semibold text-navy sm:text-4xl">
            Three kinds of events, one standard of gear
          </h2>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          <div className="group overflow-hidden rounded-2xl border border-line bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
            <div className="relative aspect-[4/3] overflow-hidden">
              <Image
                src="/images/category-residential.jpg"
                alt="Backyard reception under string lights with a compact PA speaker"
                fill
                sizes="(min-width: 640px) 33vw, 100vw"
                className="object-cover transition duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-navy-dark/70 via-navy-dark/0 to-transparent" />
              <span className="absolute bottom-3 left-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/90 text-signal shadow">
                <Home className="h-5 w-5" strokeWidth={2.25} />
              </span>
            </div>
            <div className="p-6">
              <h3 className="font-display text-xl font-semibold text-navy">
                Home &amp; Residential
              </h3>
              <p className="mt-2 text-steel">
                Backyard receptions, quinceañeras, graduation parties, and family gatherings —
                systems sized for a patio, not a stadium.
              </p>
            </div>
          </div>

          <div className="group overflow-hidden rounded-2xl border border-line bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
            <div className="relative aspect-[4/3] overflow-hidden">
              <Image
                src="/images/category-commercial.jpg"
                alt="Outdoor market activation with line-array PA speakers"
                fill
                sizes="(min-width: 640px) 33vw, 100vw"
                className="object-cover transition duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-navy-dark/70 via-navy-dark/0 to-transparent" />
              <span className="absolute bottom-3 left-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/90 text-signal shadow">
                <Building2 className="h-5 w-5" strokeWidth={2.25} />
              </span>
            </div>
            <div className="p-6">
              <h3 className="font-display text-xl font-semibold text-navy">
                Commercial Events
              </h3>
              <p className="mt-2 text-steel">
                Retail activations, markets, festivals, and brand pop-ups that need reliable sound
                running all day, every day.
              </p>
            </div>
          </div>

          <div className="group overflow-hidden rounded-2xl border border-line bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
            <div className="relative aspect-[4/3] overflow-hidden">
              <Image
                src="/images/category-corporate.jpg"
                alt="Corporate conference stage with line-array speakers and screen"
                fill
                sizes="(min-width: 640px) 33vw, 100vw"
                className="object-cover transition duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-navy-dark/70 via-navy-dark/0 to-transparent" />
              <span className="absolute bottom-3 left-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/90 text-signal shadow">
                <Briefcase className="h-5 w-5" strokeWidth={2.25} />
              </span>
            </div>
            <div className="p-6">
              <h3 className="font-display text-xl font-semibold text-navy">
                Corporate Events
              </h3>
              <p className="mt-2 text-steel">
                Conferences, town halls, product launches, and galas where speech clarity and a
                clean look both matter.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Teaser links ---------- */}
      <section className="border-t border-line bg-white">
        <div className="mx-auto max-w-6xl px-6 py-20">
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
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-sm transition hover:-translate-y-1 hover:border-signal/40 hover:shadow-xl"
            >
              <div className="relative aspect-[16/10] overflow-hidden">
                <Image
                  src="/images/category-services.jpg"
                  alt="Crew loading packed PA equipment and flight cases into a van"
                  fill
                  sizes="(min-width: 640px) 50vw, 100vw"
                  className="object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-navy-dark/70 via-navy-dark/0 to-transparent" />
                <span className="absolute bottom-3 left-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/90 text-signal shadow">
                  <Package className="h-5 w-5" strokeWidth={2.25} />
                </span>
              </div>
              <div className="flex flex-1 flex-col p-8">
                <h3 className="font-display text-2xl font-semibold text-navy">Services</h3>
                <p className="mt-2 max-w-xs text-steel">
                  Ready-to-book package tiers — we deliver, set up, and pick up.
                </p>
                <span className="mt-6 inline-flex w-fit items-center gap-2 rounded-full border border-line bg-paper px-4 py-2 text-sm font-semibold text-navy transition group-hover:border-signal group-hover:text-signal">
                  Browse services
                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </Link>

            <Link
              href="/items-for-rent"
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-sm transition hover:-translate-y-1 hover:border-signal/40 hover:shadow-xl"
            >
              <div className="relative aspect-[16/10] overflow-hidden">
                <Image
                  src="/images/category-products.jpg"
                  alt="Individual audio equipment organized on warehouse shelving"
                  fill
                  sizes="(min-width: 640px) 50vw, 100vw"
                  className="object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-navy-dark/70 via-navy-dark/0 to-transparent" />
                <span className="absolute bottom-3 left-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/90 text-signal shadow">
                  <Volume2 className="h-5 w-5" strokeWidth={2.25} />
                </span>
              </div>
              <div className="flex flex-1 flex-col p-8">
                <h3 className="font-display text-2xl font-semibold text-navy">Items for rent</h3>
                <p className="mt-2 max-w-xs text-steel">
                  Individual equipment for your own build — pick it up from us.
                </p>
                <span className="mt-6 inline-flex w-fit items-center gap-2 rounded-full border border-line bg-paper px-4 py-2 text-sm font-semibold text-navy transition group-hover:border-signal group-hover:text-signal">
                  View items
                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ---------- How booking works ---------- */}
      <section className="bg-paper">
        <div className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
          <div className="mx-auto max-w-lg text-center">
            <p className="tier-pill mx-auto">How booking works</p>
            <h2 className="mt-4 font-display text-3xl font-semibold text-navy sm:text-4xl">
              From first message to teardown
            </h2>
          </div>

          <div className="relative mt-14 grid gap-8 sm:grid-cols-4 sm:gap-6">
            <div
              className="absolute top-6 right-0 left-0 hidden h-px bg-line sm:block"
              aria-hidden
            />
            {bookingSteps.map((step, i) => (
              <div key={step.title} className="relative flex flex-col items-center text-center">
                <span className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-amber bg-paper font-display text-lg font-semibold text-navy">
                  {i + 1}
                </span>
                <span className="mt-4 flex h-10 w-10 items-center justify-center rounded-xl bg-signal-light/40 text-signal">
                  <step.icon className="h-5 w-5" strokeWidth={2.25} />
                </span>
                <h3 className="mt-4 font-display text-lg font-semibold text-navy">
                  {step.title}
                </h3>
                <p className="mt-1.5 max-w-[16rem] text-sm text-steel">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
