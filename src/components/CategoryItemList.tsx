"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import AddToCartButton from "@/components/AddToCartButton";
import { iconForCategory } from "@/lib/categoryIcons";
import { Search, ChevronRight } from "lucide-react";

type Item = {
  id: string;
  name: string;
  description: string | null;
  dailyRate: number;
  unitCount: number;
  photoUrl: string | null;
};

export default function CategoryItemList({
  items,
  categoryName,
}: {
  items: Item[];
  categoryName: string;
}) {
  const Icon = iconForCategory(categoryName);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((i) => !q || i.name.toLowerCase().includes(q));
  }, [items, query]);

  return (
    <div>
      <div className="relative w-full sm:max-w-sm">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-steel" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search this category…"
          className="w-full rounded-full border border-line bg-white py-2.5 pl-10 pr-4 text-sm text-navy transition focus:border-signal focus:outline-none focus:ring-2 focus:ring-signal/15"
        />
      </div>

      {query && (
        <p className="mt-3 text-sm text-steel">
          {filtered.length} result{filtered.length === 1 ? "" : "s"} for &ldquo;{query}&rdquo;
        </p>
      )}

      <div className="mt-6 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="group flex flex-col gap-3 p-4 transition-colors hover:bg-paper/60 sm:flex-row sm:items-center sm:gap-4"
          >
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-navy">
              {item.photoUrl ? (
                <Image src={item.photoUrl} alt={item.name} fill sizes="48px" className="object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-signal-light/60">
                  <Icon className="h-5 w-5" strokeWidth={1.75} />
                </span>
              )}
            </div>

            <Link href={`/items/${item.id}`} className="min-w-0 flex-1">
              <p className="flex items-center gap-1 font-semibold text-navy">
                {item.name}
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-steel opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
              </p>
              {item.description && <p className="mt-0.5 text-sm text-steel">{item.description}</p>}
            </Link>

            <div className="flex shrink-0 items-center justify-between gap-4 sm:justify-end sm:gap-6">
              <div className="text-right">
                <p className="font-display text-base font-semibold text-navy">
                  ${item.dailyRate.toFixed(0)}
                  <span className="text-xs font-normal text-steel"> / day</span>
                </p>
                <p className="text-xs text-steel">
                  {item.unitCount} unit{item.unitCount === 1 ? "" : "s"}
                </p>
              </div>
              <AddToCartButton
                itemId={item.id}
                name={item.name}
                dailyRate={item.dailyRate}
                maxQuantity={item.unitCount}
                compact
              />
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <p className="py-12 text-center text-steel">No equipment matches &ldquo;{query}&rdquo;.</p>
        )}
      </div>
    </div>
  );
}
