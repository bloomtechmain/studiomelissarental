import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import BookingWidget from "@/components/BookingWidget";
import { ChevronLeft, Check, Phone } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PackagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const pkg = await prisma.package.findUnique({
    where: { id, active: true },
    include: { components: { include: { item: true } } },
  });
  if (!pkg) notFound();

  const isCustom = pkg.components.length === 0;

  return (
    <div className="mx-auto max-w-5xl px-6 py-14">
      <Link
        href="/#packages"
        className="inline-flex items-center gap-1 text-sm font-semibold text-steel transition hover:text-signal"
      >
        <ChevronLeft className="h-4 w-4" /> Package tiers
      </Link>

      <div className="mt-6 grid gap-10 lg:grid-cols-[1.2fr_1fr]">
        <div className="animate-fade-up">
          <p className="tier-pill">Tier {pkg.tier}</p>
          <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight text-navy">
            {pkg.name}
          </h1>
          <p className="mt-4 font-display text-2xl font-semibold text-navy">
            {Number(pkg.price) > 0 ? `$${Number(pkg.price).toFixed(0)}` : "Custom quote"}
          </p>
          {pkg.description && (
            <p className="mt-5 max-w-md leading-relaxed text-steel">{pkg.description}</p>
          )}

          {!isCustom && (
            <div className="mt-8">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-steel">
                What&apos;s included
              </h2>
              <ul className="mt-3 space-y-2.5">
                {pkg.components.map((c) => (
                  <li key={c.id} className="flex items-center gap-2.5 text-navy">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-signal-light/60 text-signal">
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                    {c.quantity}× {c.item.name}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <div className="lg:sticky lg:top-24 lg:self-start">
          {isCustom ? (
            <div className="rounded-2xl border border-line bg-white p-7 shadow-sm">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-signal-light/50 text-signal">
                <Phone className="h-5 w-5" strokeWidth={2.25} />
              </span>
              <h3 className="mt-4 font-display text-lg font-semibold text-navy">
                Request a quote
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-steel">
                The {pkg.name} tier is a custom, per-event build — tell us about it and we&apos;ll
                scope it with you. This tier isn&apos;t available for instant online booking.
              </p>
              <Link
                href={`/quote?tier=${encodeURIComponent(pkg.name)}`}
                className="mt-5 flex w-full items-center justify-center gap-1.5 rounded-full bg-amber px-6 py-3 font-semibold text-amber-deep shadow-sm shadow-amber/30 transition hover:brightness-95 active:scale-[0.98]"
              >
                Request a quote
              </Link>
            </div>
          ) : (
            <BookingWidget target={{ kind: "package", packageId: pkg.id, packageName: pkg.name }} />
          )}
        </div>
      </div>
    </div>
  );
}
