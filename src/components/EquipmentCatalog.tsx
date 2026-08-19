"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Search,
  ChevronRight,
  Speaker,
  Waves,
  SlidersHorizontal,
  Mic,
  Cable,
  Volume2,
} from "lucide-react";

const CATEGORY_ICONS: Record<string, typeof Speaker> = {
  speaker: Speaker,
  top: Speaker,
  sub: Waves,
  woofer: Waves,
  mixer: SlidersHorizontal,
  dsp: SlidersHorizontal,
  mic: Mic,
  cable: Cable,
  accessory: Cable,
  accessories: Cable,
};

function iconForCategory(name: string) {
  const key = name.toLowerCase();
  for (const [needle, Icon] of Object.entries(CATEGORY_ICONS)) {
    if (key.includes(needle)) return Icon;
  }
  return Volume2;
}

type Item = { id: string; name: string; dailyRate: number; unitCount: number };
type Category = { id: string; name: string; items: Item[] };

export default function EquipmentCatalog({ categories }: { categories: Category[] }) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return categories
      .filter((c) => !activeCategory || c.name === activeCategory)
      .map((c) => ({
        ...c,
        items: c.items.filter((i) => !q || i.name.toLowerCase().includes(q)),
      }))
      .filter((c) => c.items.length > 0);
  }, [categories, query, activeCategory]);

  const totalMatches = filtered.reduce((n, c) => n + c.items.length, 0);

  return (
    <div>
      <div className="flex flex-col gap-4">
        <div className="relative w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-steel" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search equipment…"
            className="w-full rounded-full border border-line bg-white py-2.5 pl-10 pr-4 text-sm text-navy transition focus:border-signal focus:outline-none focus:ring-2 focus:ring-signal/15"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveCategory(null)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
              activeCategory === null
                ? "bg-navy text-white"
                : "border border-line bg-white text-steel hover:border-signal/50"
            }`}
          >
            All categories
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCategory(c.name === activeCategory ? null : c.name)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                activeCategory === c.name
                  ? "bg-navy text-white"
                  : "border border-line bg-white text-steel hover:border-signal/50"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {query && (
        <p className="mt-3 text-sm text-steel">
          {totalMatches} result{totalMatches === 1 ? "" : "s"} for &ldquo;{query}&rdquo;
        </p>
      )}

      <div className="mt-8 space-y-12">
        {filtered.map((cat) => {
          const Icon = iconForCategory(cat.name);
          return (
            <div
              key={cat.id}
              className="rounded-2xl border border-line bg-paper/60 p-6 sm:p-7"
            >
              <div className="flex items-center justify-between border-b border-line pb-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-signal-light/50 text-signal">
                    <Icon className="h-4.5 w-4.5" strokeWidth={2.25} />
                  </span>
                  <h3 className="font-display text-xl font-semibold text-navy">{cat.name}</h3>
                </div>
                <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-steel">
                  {cat.items.length} item{cat.items.length === 1 ? "" : "s"}
                </span>
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {cat.items.map((item) => (
                  <Link
                    key={item.id}
                    href={`/items/${item.id}`}
                    className="group relative flex flex-col overflow-hidden rounded-xl border border-line bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-signal hover:shadow-lg hover:shadow-signal/10"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-signal-light/50 text-signal transition-colors duration-200 group-hover:bg-signal group-hover:text-white">
                        <Icon className="h-4.5 w-4.5" strokeWidth={2.25} />
                      </span>
                      <span className="rounded-full bg-paper px-2.5 py-1 text-[11px] font-semibold text-steel">
                        {item.unitCount} unit{item.unitCount === 1 ? "" : "s"}
                      </span>
                    </div>
                    <p className="mt-4 font-semibold text-navy">{item.name}</p>

                    <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
                      <p className="font-display text-lg font-semibold text-navy">
                        ${item.dailyRate.toFixed(0)}
                        <span className="text-sm font-normal text-steel"> / rental</span>
                      </p>
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-paper text-steel transition-colors duration-200 group-hover:bg-signal-light/60 group-hover:text-signal">
                        <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <p className="rounded-2xl border border-line bg-white py-12 text-center text-steel">
            No equipment matches &ldquo;{query}&rdquo;.
          </p>
        )}
      </div>
    </div>
  );
}
