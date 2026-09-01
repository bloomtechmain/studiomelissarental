import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { CategoryIcon } from "@/lib/categoryIcons";
import CategoryItemList from "@/components/CategoryItemList";

export const dynamic = "force-dynamic";

export default async function ProductCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const category = await prisma.category.findUnique({
    where: { id },
    include: {
      items: {
        where: { active: true },
        orderBy: { name: "asc" },
        include: { units: { where: { status: { in: ["AVAILABLE", "OUT"] } } } },
      },
    },
  });
  if (!category) notFound();

  const unitCount = category.items.reduce((n, item) => n + item.units.length, 0);

  return (
    <div className="mx-auto max-w-5xl px-6 py-14">
      <Link
        href="/products"
        className="inline-flex items-center gap-1 text-sm font-semibold text-steel transition hover:text-signal"
      >
        <ChevronLeft className="h-4 w-4" /> Items for rent
      </Link>

      <div className="mt-6 flex items-center gap-4">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-signal-light/50 text-signal">
          <CategoryIcon name={category.name} className="h-6 w-6" strokeWidth={2.25} />
        </span>
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-navy sm:text-4xl">
            {category.name}
          </h1>
          <p className="mt-1 text-sm text-steel">
            {category.items.length} item{category.items.length === 1 ? "" : "s"} · {unitCount} unit
            {unitCount === 1 ? "" : "s"} in stock
          </p>
        </div>
      </div>

      <div className="mt-8">
        <CategoryItemList
          categoryName={category.name}
          items={category.items.map((item) => ({
            id: item.id,
            name: item.name,
            description: item.description,
            dailyRate: Number(item.dailyRate),
            unitCount: item.units.length,
            photoUrl: item.photoUrl,
          }))}
        />
      </div>
    </div>
  );
}
