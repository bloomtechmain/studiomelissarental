import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import AddToCartButton from "@/components/AddToCartButton";
import { ChevronLeft, ShoppingCart } from "lucide-react";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const item = await prisma.item.findUnique({
    where: { id, active: true },
    select: { name: true, description: true, category: { select: { name: true } } },
  });
  if (!item) return {};
  return {
    title: `${item.name} Rental`,
    description:
      item.description ??
      `Rent the ${item.name} — ${item.category.name.toLowerCase()} available for self pickup in Greater Austin.`,
    alternates: { canonical: `/items/${id}` },
  };
}

export default async function ItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await prisma.item.findUnique({
    where: { id, active: true },
    include: {
      category: true,
      units: { where: { status: { in: ["AVAILABLE", "OUT"] } } },
    },
  });
  if (!item) notFound();

  return (
    <div className="mx-auto max-w-5xl px-6 py-14">
      <Link
        href="/items-for-rent"
        className="inline-flex items-center gap-1 text-sm font-semibold text-steel transition hover:text-signal"
      >
        <ChevronLeft className="h-4 w-4" /> Products
      </Link>

      <div className="mt-6 grid gap-10 lg:grid-cols-[1.2fr_1fr]">
        <div className="animate-fade-up">
          {item.photoUrl && (
            <div className="relative mb-6 aspect-video w-full overflow-hidden rounded-2xl border border-line bg-white">
              <Image src={item.photoUrl} alt={item.name} fill className="object-contain p-4" />
            </div>
          )}
          <p className="tier-pill">{item.category.name}</p>
          <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight text-navy">
            {item.name}
          </h1>
          <p className="mt-4 font-display text-2xl font-semibold text-navy">
            ${Number(item.dailyRate).toFixed(0)}
            <span className="text-base font-normal text-steel"> / rental</span>
          </p>
          {item.description && (
            <p className="mt-5 max-w-md leading-relaxed text-steel">{item.description}</p>
          )}
          <p className="mt-6 inline-flex items-center rounded-full border border-line bg-white px-3 py-1.5 text-sm font-medium text-steel">
            {item.units.length} unit{item.units.length === 1 ? "" : "s"} in our fleet
          </p>
        </div>
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="animate-fade-up rounded-2xl border border-line bg-white p-7 shadow-sm">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-signal-light/50 text-signal">
              <ShoppingCart className="h-5 w-5" strokeWidth={2.25} />
            </span>
            <h3 className="mt-4 font-display text-lg font-semibold text-navy">Add to your order</h3>
            <p className="mt-2 text-sm leading-relaxed text-steel">
              Building a build with multiple items? Add this to your cart, keep browsing, and
              check out everything together in one booking.
            </p>
            <div className="mt-5">
              <AddToCartButton
                itemId={item.id}
                name={item.name}
                dailyRate={Number(item.dailyRate)}
                maxQuantity={item.units.length}
              />
            </div>
            <Link
              href="/cart"
              className="mt-4 flex items-center justify-center gap-1.5 text-sm font-semibold text-signal hover:underline"
            >
              View cart &amp; check out →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
