import Link from "next/link";
import { Fragment } from "react";
import { prisma } from "@/lib/prisma";
import { addDays, format } from "date-fns";
import { slotWindow } from "@/lib/slots";

export const dynamic = "force-dynamic";

const DAYS = 14;

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default async function EquipmentTimelinePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; start?: string }>;
}) {
  const { category, start } = await searchParams;
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
  const activeCategory = category ?? categories[0]?.name;
  const startStr = start ?? todayStr();
  const startDate = new Date(`${startStr}T00:00:00`);
  const days = Array.from({ length: DAYS }, (_, i) => addDays(startDate, i));
  const windowEnd = addDays(startDate, DAYS);

  const items = await prisma.item.findMany({
    where: activeCategory ? { category: { name: activeCategory } } : undefined,
    orderBy: { name: "asc" },
    include: {
      units: {
        orderBy: { serialNumber: "asc" },
        include: {
          assignments: {
            where: { blockedFrom: { lt: windowEnd }, blockedUntil: { gt: startDate } },
          },
        },
      },
    },
  });

  function slotBlocked(assignments: { blockedFrom: Date; blockedUntil: Date }[], day: Date, slot: "MORNING" | "AFTERNOON") {
    const dayStr = format(day, "yyyy-MM-dd");
    const { startAt, endAt } = slotWindow(dayStr, slot);
    return assignments.some((a) => a.blockedFrom < endAt && a.blockedUntil > startAt);
  }

  const prevStart = format(addDays(startDate, -DAYS), "yyyy-MM-dd");
  const nextStart = format(addDays(startDate, DAYS), "yyyy-MM-dd");

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-navy">Equipment timeline</h1>
      <p className="mt-1 text-sm text-steel">
        Every unit&apos;s booked/available status by date — each cell splits into AM (top) / PM
        (bottom) for the two rental windows.
      </p>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/admin/equipment-timeline?category=${encodeURIComponent(c.name)}&start=${startStr}`}
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                activeCategory === c.name ? "bg-navy text-white" : "border border-line bg-white text-steel"
              }`}
            >
              {c.name}
            </Link>
          ))}
        </div>
        <div className="flex gap-2">
          <Link
            href={`/admin/equipment-timeline?category=${encodeURIComponent(activeCategory ?? "")}&start=${prevStart}`}
            className="rounded border border-line bg-white px-3 py-1.5 text-sm text-navy hover:border-signal"
          >
            ← Prev 14d
          </Link>
          <Link
            href={`/admin/equipment-timeline?category=${encodeURIComponent(activeCategory ?? "")}&start=${todayStr()}`}
            className="rounded border border-line bg-white px-3 py-1.5 text-sm text-navy hover:border-signal"
          >
            Today
          </Link>
          <Link
            href={`/admin/equipment-timeline?category=${encodeURIComponent(activeCategory ?? "")}&start=${nextStart}`}
            className="rounded border border-line bg-white px-3 py-1.5 text-sm text-navy hover:border-signal"
          >
            Next 14d →
          </Link>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-line bg-white shadow-sm">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-paper px-3 py-2 text-left font-semibold text-steel">
                Unit
              </th>
              {days.map((d) => (
                <th key={d.toISOString()} className="border-l border-line bg-paper px-1 py-2 text-center font-medium text-steel">
                  {format(d, "MMM d")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <Fragment key={item.id}>
                <tr className="bg-paper/60">
                  <td colSpan={DAYS + 1} className="px-3 py-1.5 text-left font-semibold text-navy">
                    {item.name}
                  </td>
                </tr>
                {item.units.map((unit) => (
                  <tr key={unit.id} className="border-t border-line">
                    <td className="sticky left-0 z-10 bg-white px-3 py-1.5 text-steel">
                      {unit.serialNumber}
                    </td>
                    {days.map((day) => {
                      if (unit.status === "MAINTENANCE" || unit.status === "RETIRED") {
                        return (
                          <td key={day.toISOString()} className="border-l border-line p-0.5">
                            <div className="h-5 w-full rounded bg-line" title={unit.status} />
                          </td>
                        );
                      }
                      const am = slotBlocked(unit.assignments, day, "MORNING");
                      const pm = slotBlocked(unit.assignments, day, "AFTERNOON");
                      return (
                        <td key={day.toISOString()} className="border-l border-line p-0.5">
                          <div className="flex h-5 w-full flex-col gap-0.5">
                            <div className={`h-2 flex-1 rounded-sm ${am ? "bg-navy" : "bg-signal-light/50"}`} />
                            <div className={`h-2 flex-1 rounded-sm ${pm ? "bg-navy" : "bg-signal-light/50"}`} />
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </Fragment>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={DAYS + 1} className="px-4 py-8 text-center text-steel">
                  No items in this category.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex items-center gap-4 text-xs text-steel">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-signal-light/50" /> Available
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-navy" /> Booked
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-line" /> Maintenance / Retired
        </span>
      </div>
    </div>
  );
}
