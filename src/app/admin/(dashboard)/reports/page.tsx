import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { format, subMonths, startOfMonth } from "date-fns";
import SectionHeader from "@/components/admin/SectionHeader";
import { Truck, ListOrdered, Repeat } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminReportsPage() {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  const twelveMonthsAgo = startOfMonth(subMonths(new Date(), 11));

  const [outUnits, lines] = await Promise.all([
    prisma.equipmentUnit.findMany({
      where: { status: "OUT" },
      include: { item: true },
    }),
    prisma.bookingLine.findMany({
      where: { booking: { status: { not: "CANCELLED" }, startAt: { gte: twelveMonthsAgo } } },
      include: { item: true, booking: { select: { startAt: true } } },
    }),
  ]);

  const outByItem = new Map<string, number>();
  for (const u of outUnits) {
    outByItem.set(u.item.name, (outByItem.get(u.item.name) ?? 0) + 1);
  }

  const unitsRented = new Map<string, number>(); // total quantity rented, per item
  const timesBooked = new Map<string, number>(); // number of separate bookings that included it
  for (const l of lines) {
    unitsRented.set(l.item.name, (unitsRented.get(l.item.name) ?? 0) + l.quantity);
    timesBooked.set(l.item.name, (timesBooked.get(l.item.name) ?? 0) + 1);
  }

  const mostRented = [...unitsRented.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([name, units]) => ({ name, units, times: timesBooked.get(name) ?? 0 }));

  const byMonth = new Map<string, number>();
  for (let i = 0; i < 12; i++) {
    byMonth.set(format(subMonths(new Date(), 11 - i), "MMM yyyy"), 0);
  }
  for (const l of lines) {
    const key = format(l.booking.startAt, "MMM yyyy");
    if (byMonth.has(key)) byMonth.set(key, byMonth.get(key)! + l.quantity);
  }
  const maxMonthly = Math.max(1, ...byMonth.values());
  const totalUnitsOut = [...byMonth.values()].reduce((a, b) => a + b, 0);

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-navy">Reports</h1>
      <p className="mt-1 text-sm text-steel">
        Equipment activity — what&apos;s currently out, what rents most, and how often gear is
        going out the door.
      </p>

      <section className="mt-6 rounded-2xl border border-line bg-white p-5 shadow-sm">
        <SectionHeader icon={Truck}>Currently out ({outUnits.length} units)</SectionHeader>
        <ul className="mt-3 divide-y divide-line">
          {[...outByItem.entries()]
            .sort((a, b) => b[1] - a[1])
            .map(([name, count]) => (
              <li key={name} className="flex items-center justify-between py-2.5 text-sm">
                <span className="text-navy">{name}</span>
                <span className="font-semibold text-navy">{count}</span>
              </li>
            ))}
          {outByItem.size === 0 && (
            <p className="py-3 text-sm text-steel">Nothing is currently out.</p>
          )}
        </ul>
      </section>

      <section className="mt-6 rounded-2xl border border-line bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-baseline justify-between border-b border-line pb-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-signal-light/50 text-signal">
              <Repeat className="h-4 w-4" strokeWidth={2.25} />
            </span>
            <h2 className="font-semibold text-navy">Units going out by month (last 12 months)</h2>
          </div>
          <p className="font-display text-xl font-semibold text-navy">{totalUnitsOut}</p>
        </div>
        <div className="mt-5 flex items-end gap-2" style={{ height: 160 }}>
          {[...byMonth.entries()].map(([month, count]) => (
            <div key={month} className="flex flex-1 flex-col items-center gap-1.5">
              <div
                className="w-full rounded-t bg-gradient-to-t from-signal to-signal-light"
                style={{ height: `${Math.max(4, (count / maxMonthly) * 140)}px` }}
                title={`${count} units`}
              />
              <span className="text-[10px] text-steel">{month.split(" ")[0]}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-line bg-white p-5 shadow-sm">
        <SectionHeader icon={ListOrdered}>Most rented equipment (last 12 months)</SectionHeader>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs font-semibold uppercase tracking-wider text-steel">
                <th className="py-2 pr-4">Item</th>
                <th className="py-2 pr-4">Times rented</th>
                <th className="py-2">Total units rented</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {mostRented.map((row) => (
                <tr key={row.name}>
                  <td className="py-2.5 pr-4 text-navy">{row.name}</td>
                  <td className="py-2.5 pr-4 font-semibold text-navy">{row.times}</td>
                  <td className="py-2.5 font-semibold text-navy">{row.units}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {mostRented.length === 0 && (
            <p className="py-3 text-sm text-steel">No rentals recorded yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
