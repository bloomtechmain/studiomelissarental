import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import BookingWidget from "@/components/BookingWidget";
import { ChevronLeft } from "lucide-react";

export const dynamic = "force-dynamic";

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
        href="/#catalog"
        className="inline-flex items-center gap-1 text-sm font-semibold text-steel transition hover:text-signal"
      >
        <ChevronLeft className="h-4 w-4" /> Equipment catalog
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
          <BookingWidget
            target={{
              kind: "item",
              itemId: item.id,
              itemName: item.name,
              maxQuantity: item.units.length,
            }}
          />
        </div>
      </div>
    </div>
  );
}
