import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Building2, ChevronRight, Home, MapPin, Navigation, Tent, Users } from "lucide-react";
import ServiceAreaMap from "@/components/ServiceAreaMapLoader";

const DIRECTIONS_URL = "https://www.google.com/maps/dir/?api=1&destination=30.4394,-97.6200";

const tierMeta: Record<
  string,
  { image: string; alt: string; icon: typeof Home; note: string }
> = {
  Backyard: {
    image: "/images/tier-backyard.jpg",
    alt: "Backyard reception under string lights with a compact PA speaker",
    icon: Home,
    note: "Same-day drop-off available.",
  },
  Gathering: {
    image: "/images/tier-gathering.jpg",
    alt: "Mid-size community hall event with PA speakers flanking a small stage",
    icon: Users,
    note: "On-site technician available as an add-on.",
  },
  Hall: {
    image: "/images/tier-hall.jpg",
    alt: "Large banquet hall with a line-array PA system and digital mixing console",
    icon: Building2,
    note: "On-site engineer strongly recommended, included at this tier.",
  },
  Field: {
    image: "/images/tier-field.jpg",
    alt: "Full stacked PA system on an outdoor festival stage at dusk",
    icon: Tent,
    note: "On-site engineer required · power and load-in plan coordinated in advance.",
  },
};

const serviceAreaCities = [
  "Austin",
  "Round Rock",
  "Georgetown",
  "Cedar Park",
  "Hutto",
  "Kyle",
  "Buda",
  "San Marcos",
  "Dripping Springs",
];

export const dynamic = "force-dynamic";

export default async function ServicesPage() {
  const packages = await prisma.package.findMany({
    where: { active: true },
    orderBy: { tier: "asc" },
    include: { components: { include: { item: true } } },
  });

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

        <div className="relative mx-auto max-w-6xl px-6 py-16">
          <div className="max-w-2xl">
            <p className="tier-pill bg-white/10 text-amber ring-1 ring-inset ring-white/15">
              Full service
            </p>
            <h1 className="mt-4 font-display text-4xl font-semibold text-white sm:text-5xl">
              Services
            </h1>
            <p className="mt-3 text-lg leading-relaxed text-signal-light/80">
              Four tiers, sized to your guest count. Every package includes delivery, setup,
              teardown, and pickup within our service area.
            </p>
            <p className="mt-3 text-signal-light/70">
              Need something in between, or a system for a space we haven&apos;t listed? Request
              a custom quote and we&apos;ll build it around your event.
            </p>
            <Link
              href="/quote"
              className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-amber px-6 py-3 font-semibold text-amber-deep shadow-sm shadow-amber/30 transition hover:brightness-95 active:scale-[0.98]"
            >
              Request a custom quote
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {packages.map((pkg) => {
          const featured = pkg.tier === 2;
          const meta = tierMeta[pkg.name];
          const Icon = meta?.icon ?? Home;
          return (
            <Link
              key={pkg.id}
              href={`/packages/${pkg.id}`}
              className={`group relative flex h-full flex-col overflow-hidden rounded-2xl border bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                featured ? "border-amber/50 shadow-lg shadow-amber/10" : "border-line shadow-sm"
              }`}
            >
              {featured && (
                <span className="absolute top-3 right-3 z-10 rounded-full bg-amber px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-amber-deep shadow-sm">
                  Best fit
                </span>
              )}

              {meta && (
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={meta.image}
                    alt={meta.alt}
                    fill
                    sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy-dark/75 via-navy-dark/10 to-transparent" />
                  <span className="absolute bottom-3 left-3 flex h-9 w-9 items-center justify-center rounded-lg bg-white/90 text-signal shadow">
                    <Icon className="h-4.5 w-4.5" strokeWidth={2.25} />
                  </span>
                  <span className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-navy/80 font-display text-sm font-bold text-white ring-1 ring-white/20">
                    {pkg.tier}
                  </span>
                </div>
              )}

              <div className="flex flex-1 flex-col p-7">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-steel">
                  Tier {pkg.tier}
                </p>
                <p className="font-display text-2xl font-semibold text-navy">{pkg.name}</p>

                <div className="mt-3 min-h-[108px] rounded-xl border border-signal/20 bg-signal-light/25 p-3.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-signal">
                    Best for
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-navy/80">{pkg.description}</p>
                </div>

                <ul className="mt-4 divide-y divide-line/70">
                  {pkg.components.map((c) => (
                    <li key={c.id} className="flex items-center gap-3 py-2 first:pt-0">
                      <span className="flex h-6 min-w-6 shrink-0 items-center justify-center rounded-md bg-signal-light/40 px-1.5 font-display text-xs font-bold text-signal">
                        {c.quantity}×
                      </span>
                      <span className="text-sm leading-snug text-navy/85">{c.item.name}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-auto border-t border-line pt-5">
                  {pkg.tier === 4 ? (
                    <p className="font-display text-lg font-semibold text-navy">Custom quote</p>
                  ) : (
                    <p>
                      <span className="font-display text-2xl font-semibold text-navy">
                        ${Number(pkg.price).toFixed(0)}
                      </span>
                      <span className="text-sm text-steel"> / rental</span>
                    </p>
                  )}
                  {meta && (
                    <p className="mt-1 min-h-[2.25rem] text-xs leading-snug text-steel">
                      {meta.note}
                    </p>
                  )}
                </div>

                <span
                  className={`mt-5 flex items-center justify-center gap-1.5 rounded-full py-2.5 text-sm font-semibold transition-all duration-200 ${
                    featured
                      ? "bg-navy text-white group-hover:brightness-110"
                      : "border border-navy/15 text-navy group-hover:border-navy group-hover:bg-navy group-hover:text-white"
                  }`}
                >
                  Request a quote
                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          );
        })}
        </div>
      </div>

      {/* ---------- Service area ---------- */}
      <section className="border-t border-line bg-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="tier-pill">
              <MapPin className="mr-1.5 -ml-0.5 h-3.5 w-3.5" strokeWidth={2.5} />
              Service area
            </p>
            <h2 className="mt-4 font-display text-3xl font-semibold text-navy sm:text-4xl">
              Where we deliver
            </h2>
            <p className="mt-4 leading-relaxed text-steel">
              Based in Pflugerville, we deliver and pick up throughout the Greater Austin area,
              including Austin, Round Rock, Georgetown, Cedar Park, Hutto, Kyle, Buda, San
              Marcos, and Dripping Springs.
            </p>
            <p className="mt-3 text-sm font-semibold text-signal">Delivery radius: 70km from Pflugerville</p>

            <div className="mt-6 flex flex-wrap gap-2">
              {serviceAreaCities.map((city) => (
                <span
                  key={city}
                  className="rounded-full border border-line bg-paper px-3 py-1.5 text-sm font-medium text-navy"
                >
                  {city}
                </span>
              ))}
            </div>
          </div>

          <div className="relative h-[380px] overflow-hidden rounded-2xl border border-line shadow-sm sm:h-[440px]">
            <ServiceAreaMap />
            <a
              href={DIRECTIONS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute top-3 right-3 z-[1000] inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-sm font-semibold text-navy shadow-md ring-1 ring-line transition hover:bg-paper"
            >
              <Navigation className="h-4 w-4 text-signal" strokeWidth={2.25} />
              Directions
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
