import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ChevronLeft, MessageSquareText } from "lucide-react";
import QuoteRequestForm from "@/components/QuoteRequestForm";

export const dynamic = "force-dynamic";

export default async function QuotePage({
  searchParams,
}: {
  searchParams: Promise<{ tier?: string }>;
}) {
  const { tier } = await searchParams;
  const packages = await prisma.package.findMany({
    where: { active: true },
    orderBy: { tier: "asc" },
    select: { name: true },
  });

  return (
    <div>
      <section className="bg-dot-grid relative overflow-hidden border-b border-line bg-signal-light/20">
        <div className="pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_70%_60%_at_15%_0%,black,transparent)]" />
        <div className="relative mx-auto max-w-3xl px-6 py-14">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm font-semibold text-steel transition hover:text-signal"
          >
            <ChevronLeft className="h-4 w-4" /> Back home
          </Link>

          <div className="mt-6 flex animate-fade-up items-start gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-signal-light/50 text-signal">
              <MessageSquareText className="h-5 w-5" strokeWidth={2.25} />
            </span>
            <div>
              <p className="tier-pill">Free & no obligation</p>
              <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-navy sm:text-4xl">
                Request a quote
              </h1>
              <p className="mt-3 max-w-xl leading-relaxed text-steel">
                Tell us about your event and we&apos;ll follow up with a quote — whether that&apos;s
                matching you to a package tier or scoping a custom, large-format build.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-6 py-10">
        <QuoteRequestForm tierOptions={packages.map((p) => p.name)} defaultTier={tier} />
      </div>
    </div>
  );
}
