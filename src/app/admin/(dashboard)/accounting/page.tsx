import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { redirect } from "next/navigation";
import {
  format,
  subMonths,
  subWeeks,
  startOfMonth,
  startOfWeek,
  endOfWeek,
  startOfDay,
  endOfDay,
} from "date-fns";
import SectionHeader from "@/components/admin/SectionHeader";
import { TrendingUp, PieChart, CalendarDays, CalendarRange, Calendar } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminAccountingPage() {
  const session = await getSession();
  if (!can(session, "accounting:view")) redirect("/admin");

  const now = new Date();
  const twelveMonthsAgo = startOfMonth(subMonths(now, 11));
  const bookings = await prisma.booking.findMany({
    where: { status: { not: "CANCELLED" }, startAt: { gte: twelveMonthsAgo } },
    include: { package: true },
  });

  // Income tiles — bucketed by booking date, same convention the monthly
  // chart below already used (there's no online payment processor wired up,
  // so amountPaid has no separate "date received" to bucket by instead).
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const monthStart = startOfMonth(now);

  let todayIncome = 0;
  let weekIncome = 0;
  let monthIncome = 0;
  for (const b of bookings) {
    const amt = Number(b.amountPaid);
    if (b.startAt >= todayStart && b.startAt <= todayEnd) todayIncome += amt;
    if (b.startAt >= weekStart && b.startAt <= weekEnd) weekIncome += amt;
    if (b.startAt >= monthStart) monthIncome += amt;
  }

  const byMonth = new Map<string, number>();
  for (let i = 0; i < 12; i++) {
    byMonth.set(format(subMonths(now, 11 - i), "MMM yyyy"), 0);
  }
  for (const b of bookings) {
    const key = format(b.startAt, "MMM yyyy");
    if (byMonth.has(key)) byMonth.set(key, byMonth.get(key)! + Number(b.amountPaid));
  }

  const byWeek = new Map<string, number>();
  for (let i = 0; i < 8; i++) {
    const ws = startOfWeek(subWeeks(now, 7 - i), { weekStartsOn: 1 });
    byWeek.set(format(ws, "MMM d"), 0);
  }
  for (const b of bookings) {
    const ws = startOfWeek(b.startAt, { weekStartsOn: 1 });
    const key = format(ws, "MMM d");
    if (byWeek.has(key)) byWeek.set(key, byWeek.get(key)! + Number(b.amountPaid));
  }

  const byTier = new Map<string, number>();
  for (const b of bookings) {
    const key = b.package?.name ?? "Individual items (no package)";
    byTier.set(key, (byTier.get(key) ?? 0) + Number(b.amountPaid));
  }

  const totalRevenue = [...byMonth.values()].reduce((a, b) => a + b, 0);
  const maxMonthly = Math.max(1, ...byMonth.values());
  const maxWeekly = Math.max(1, ...byWeek.values());

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-navy">Accounting</h1>
      <p className="mt-1 text-sm text-steel">
        Owner only. Based on amounts recorded as paid, bucketed by each booking&apos;s event date.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-steel">
            <Calendar className="h-4 w-4" strokeWidth={2.25} />
            <p className="text-xs font-semibold uppercase tracking-wider">Today</p>
          </div>
          <p className="mt-2 font-display text-2xl font-semibold text-navy">
            ${todayIncome.toFixed(0)}
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-steel">
            <CalendarDays className="h-4 w-4" strokeWidth={2.25} />
            <p className="text-xs font-semibold uppercase tracking-wider">This week</p>
          </div>
          <p className="mt-2 font-display text-2xl font-semibold text-navy">
            ${weekIncome.toFixed(0)}
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-steel">
            <CalendarRange className="h-4 w-4" strokeWidth={2.25} />
            <p className="text-xs font-semibold uppercase tracking-wider">This month</p>
          </div>
          <p className="mt-2 font-display text-2xl font-semibold text-navy">
            ${monthIncome.toFixed(0)}
          </p>
        </div>
      </div>

      <section className="mt-6 rounded-2xl border border-line bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-baseline justify-between border-b border-line pb-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-signal-light/50 text-signal">
              <TrendingUp className="h-4 w-4" strokeWidth={2.25} />
            </span>
            <h2 className="font-semibold text-navy">Income by month (last 12 months)</h2>
          </div>
          <p className="font-display text-xl font-semibold text-navy">${totalRevenue.toFixed(0)}</p>
        </div>
        <div className="mt-5 flex items-end gap-2" style={{ height: 160 }}>
          {[...byMonth.entries()].map(([month, amount]) => (
            <div key={month} className="flex flex-1 flex-col items-center gap-1.5">
              <div
                className="w-full rounded-t bg-gradient-to-t from-signal to-signal-light"
                style={{ height: `${Math.max(4, (amount / maxMonthly) * 140)}px` }}
                title={`$${amount.toFixed(2)}`}
              />
              <span className="text-[10px] text-steel">{month.split(" ")[0]}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-line bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2.5 border-b border-line pb-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-signal-light/50 text-signal">
            <CalendarDays className="h-4 w-4" strokeWidth={2.25} />
          </span>
          <h2 className="font-semibold text-navy">Income by week (last 8 weeks)</h2>
        </div>
        <div className="mt-5 flex items-end gap-2" style={{ height: 140 }}>
          {[...byWeek.entries()].map(([week, amount]) => (
            <div key={week} className="flex flex-1 flex-col items-center gap-1.5">
              <div
                className="w-full rounded-t bg-gradient-to-t from-signal to-signal-light"
                style={{ height: `${Math.max(4, (amount / maxWeekly) * 120)}px` }}
                title={`$${amount.toFixed(2)}`}
              />
              <span className="text-[10px] text-steel">{week}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-line bg-white p-5 shadow-sm">
        <SectionHeader icon={PieChart}>Revenue by package tier</SectionHeader>
        <ul className="mt-3 divide-y divide-line">
          {[...byTier.entries()]
            .sort((a, b) => b[1] - a[1])
            .map(([tier, amount]) => (
              <li key={tier} className="flex items-center justify-between py-2.5 text-sm">
                <span className="text-navy">{tier}</span>
                <span className="font-semibold text-navy">${amount.toFixed(2)}</span>
              </li>
            ))}
          {byTier.size === 0 && <p className="py-3 text-sm text-steel">No revenue recorded yet.</p>}
        </ul>
      </section>
    </div>
  );
}
