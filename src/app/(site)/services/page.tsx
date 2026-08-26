import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Check, ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ServicesPage() {
  const packages = await prisma.package.findMany({
    where: { active: true },
    orderBy: { tier: "asc" },
    include: { components: { include: { item: true } } },
  });

  return (
    <div>
      <section className="bg-dot-grid relative overflow-hidden border-b border-line bg-signal-light/20">
        <div className="pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_70%_60%_at_15%_0%,black,transparent)]" />
        <div className="relative mx-auto max-w-6xl px-6 py-16">
          <div className="max-w-xl">
            <p className="tier-pill">Full service</p>
            <h1 className="mt-4 font-display text-4xl font-semibold text-navy sm:text-5xl">
              Services
            </h1>
            <p className="mt-3 text-lg text-steel">
              A ready-to-book package matched to your room size and headcount — we deliver, set
              up, and pick up.
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
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

                {(Number(pkg.price) > 0 || pkg.tier === 4) && (
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
                )}

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
      </div>
    </div>
  );
}
