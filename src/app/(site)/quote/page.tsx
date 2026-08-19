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
    <div className="mx-auto max-w-3xl px-6 py-14">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm font-semibold text-steel transition hover:text-signal"
      >
        <ChevronLeft className="h-4 w-4" /> Back home
      </Link>

      <div className="mt-6 animate-fade-up">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-signal-light/50 text-signal">
          <MessageSquareText className="h-5 w-5" strokeWidth={2.25} />
        </span>
        <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight text-navy sm:text-4xl">
          Request a quote
        </h1>
        <p className="mt-3 max-w-xl leading-relaxed text-steel">
          Tell us about your event and we&apos;ll follow up with a quote — whether that&apos;s
          matching you to a package tier or scoping a custom, large-format build.
        </p>
      </div>

      <div className="mt-8">
        <QuoteRequestForm tierOptions={packages.map((p) => p.name)} defaultTier={tier} />
      </div>
    </div>
  );
}
