import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Check, ChevronRight, Clock, Sparkles } from "lucide-react";
import EquipmentCatalog from "@/components/EquipmentCatalog";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [packages, categories] = await Promise.all([
    prisma.package.findMany({
      where: { active: true },
      orderBy: { tier: "asc" },
      include: { components: { include: { item: true } } },
    }),
    prisma.category.findMany({
      orderBy: { name: "asc" },
      include: {
        items: {
          where: { active: true },
          orderBy: { name: "asc" },
          include: { units: { where: { status: { in: ["AVAILABLE", "OUT"] } } } },
        },
      },
    }),
  ]);

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
              Browse our package tiers or individual equipment, check live availability, and
              request your booking online. We handle delivery, setup, and pickup.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="#packages"
                className="rounded-full bg-amber px-6 py-3 font-semibold text-amber-deep shadow-sm shadow-amber/30 transition hover:brightness-95 active:scale-[0.98]"
              >
                Browse packages
              </Link>
              <Link
                href="#catalog"
                className="inline-flex items-center gap-1.5 rounded-full border border-line px-6 py-3 font-semibold text-navy transition hover:border-navy"
              >
                View equipment
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
                    <p className="text-sm font-semibold text-white">8:00 AM – 6:00 PM</p>
                    <p className="text-xs text-signal-light/60">Morning / day rental window</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-4 py-3">
                  <Clock className="h-4 w-4 shrink-0 text-signal-light" />
                  <div>
                    <p className="text-sm font-semibold text-white">3:00 PM – 12:00 AM</p>
                    <p className="text-xs text-signal-light/60">Afternoon / night rental window</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Packages ---------- */}
      <section id="packages" className="mx-auto max-w-6xl px-6 py-20 scroll-mt-20">
        <div className="max-w-xl">
          <h2 className="font-display text-3xl font-semibold text-navy">Package tiers</h2>
          <p className="mt-2 text-steel">
            A ready-to-book bundle matched to your room size and headcount.
          </p>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {packages.map((pkg) => {
            const featured = pkg.tier === 2;
            return (
              <Link
                key={pkg.id}
                href={`/packages/${pkg.id}`}
                className={`group relative flex h-full flex-col overflow-hidden rounded-2xl border bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                  featured ? "border-amber/50 shadow-lg shadow-amber/10" : "border-line shadow-sm"
                }`}
              >
                <div className={`h-1.5 w-full ${featured ? "bg-amber" : "bg-signal/60"}`} />
                {featured && (
                  <span className="absolute top-5 right-6 rounded-full bg-amber px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-amber-deep shadow-sm">
                    Best fit
                  </span>
                )}

                <div className="flex flex-1 flex-col p-7">
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-display text-base font-bold ${
                        featured ? "bg-amber/15 text-amber-deep" : "bg-navy text-white"
                      }`}
                    >
                      {pkg.tier}
                    </span>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-steel">
                        Tier {pkg.tier}
                      </p>
                      <p className="font-display text-lg font-semibold text-navy">{pkg.name}</p>
                    </div>
                  </div>

                  <p className="mt-4 text-sm leading-relaxed text-steel">{pkg.description}</p>

                  <div className="mt-5 border-t border-line pt-5">
                    {Number(pkg.price) > 0 ? (
                      <p>
                        <span className="font-display text-3xl font-semibold text-navy">
                          ${Number(pkg.price).toFixed(0)}
                        </span>
                        <span className="text-sm text-steel"> / rental</span>
                      </p>
                    ) : (
                      <p className="font-display text-2xl font-semibold text-navy">Custom quote</p>
                    )}
                  </div>

                  <ul className="mt-4 flex-1 space-y-2.5">
                    {pkg.components.slice(0, 4).map((c) => (
                      <li key={c.id} className="flex items-start gap-2.5 text-sm text-navy/80">
                        <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-signal-light/60 text-signal">
                          <Check className="h-2.5 w-2.5" strokeWidth={3.5} />
                        </span>
                        {c.quantity}× {c.item.name}
                      </li>
                    ))}
                  </ul>

                  <span
                    className={`mt-6 flex items-center justify-center gap-1.5 rounded-full py-2.5 text-sm font-semibold transition-all duration-200 ${
                      featured
                        ? "bg-navy text-white group-hover:brightness-110"
                        : "border border-navy/15 text-navy group-hover:border-navy group-hover:bg-navy group-hover:text-white"
                    }`}
                  >
                    {pkg.components.length > 0 ? "Check availability" : "Request a quote"}
                    <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ---------- Catalog ---------- */}
      <section id="catalog" className="border-t border-line bg-white scroll-mt-20">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="max-w-xl">
            <h2 className="font-display text-3xl font-semibold text-navy">Equipment catalog</h2>
            <p className="mt-2 text-steel">Book individual items for your own build.</p>
          </div>

          <div className="mt-8">
            <EquipmentCatalog
              categories={categories
                .filter((cat) => cat.items.length > 0)
                .map((cat) => ({
                  id: cat.id,
                  name: cat.name,
                  items: cat.items.map((item) => ({
                    id: item.id,
                    name: item.name,
                    dailyRate: Number(item.dailyRate),
                    unitCount: item.units.length,
                  })),
                }))}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
