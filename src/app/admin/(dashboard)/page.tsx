import Link from "next/link";
import type { ReactNode } from "react";
import { prisma } from "@/lib/prisma";
import { format, isPast, isToday } from "date-fns";
import { Clock3, CalendarClock, Truck, Wrench, Target, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const now = new Date();
  const in7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [pending, upcoming, outUnits, maintenance, dueLeads] = await Promise.all([
    prisma.booking.findMany({
      where: { status: "PENDING" },
      orderBy: { startAt: "asc" },
      include: { customer: true },
      take: 10,
    }),
    prisma.booking.findMany({
      where: { startAt: { gte: now, lte: in7 }, status: { in: ["CONFIRMED", "PENDING"] } },
      orderBy: { startAt: "asc" },
      include: { customer: true },
      take: 10,
    }),
    prisma.equipmentUnit.findMany({
      where: { status: "OUT" },
      include: {
        item: true,
        assignments: { orderBy: { blockedUntil: "asc" }, include: { booking: true }, take: 1 },
      },
      take: 20,
    }),
    prisma.equipmentUnit.findMany({
      where: { status: "MAINTENANCE" },
      include: { item: true },
    }),
    prisma.lead.findMany({
      where: { followUpOn: { not: null }, stage: { notIn: ["COMPLETED", "LOST"] } },
      orderBy: { followUpOn: "asc" },
      take: 10,
    }),
  ]);

  const dueLeadsFiltered = dueLeads.filter((l) => l.followUpOn && (isPast(l.followUpOn) || isToday(l.followUpOn)));

  const CARD =
    "rounded-2xl border border-line bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md overflow-hidden";
  const ICON_WRAP = "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg";
  const COUNT_PILL =
    "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold";
  const EMPTY =
    "rounded-xl border border-dashed border-line bg-paper/60 px-4 py-5 text-center text-sm text-steel";

  function CardHeader({
    icon,
    iconClass,
    title,
    count,
    countClass,
    href,
  }: {
    icon: ReactNode;
    iconClass: string;
    title: string;
    count: number;
    countClass: string;
    href?: string;
  }) {
    return (
      <div className="flex items-center justify-between border-b border-line bg-paper/50 px-6 py-4">
        <div className="flex items-center gap-2.5">
          <span className={`${ICON_WRAP} ${iconClass}`}>{icon}</span>
          <h2 className="font-semibold text-navy">{title}</h2>
          {count > 0 && <span className={`${COUNT_PILL} ${countClass}`}>{count}</span>}
        </div>
        {href && (
          <Link
            href={href}
            className="flex items-center gap-1 text-sm font-semibold text-signal transition-colors hover:text-navy"
          >
            View all
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.5} />
          </Link>
        )}
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-navy">Dashboard</h1>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <section className={`${CARD} animate-fade-up`}>
          <CardHeader
            icon={<Clock3 className="h-4 w-4" strokeWidth={2.25} />}
            iconClass="bg-amber/15 text-amber-deep"
            title="Pending confirmation"
            count={pending.length}
            countClass="bg-amber/15 text-amber-deep"
            href="/admin/bookings"
          />
          <div className="p-6 pt-2">
            {pending.length === 0 && <p className={EMPTY}>Nothing pending.</p>}
            <ul className="divide-y divide-line">
              {pending.map((b) => (
                <li key={b.id}>
                  <Link
                    href={`/admin/bookings/${b.id}`}
                    className="block rounded-lg px-2 py-3 -mx-2 transition-colors hover:bg-paper"
                  >
                    <p className="font-medium text-navy">{b.customer.name}</p>
                    <p className="text-sm text-steel">
                      {format(b.startAt, "MMM d, yyyy")} · {b.eventName || "Untitled event"}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className={`${CARD} animate-fade-up [animation-delay:60ms]`}>
          <CardHeader
            icon={<CalendarClock className="h-4 w-4" strokeWidth={2.25} />}
            iconClass="bg-signal-light/50 text-signal"
            title="Upcoming (next 7 days)"
            count={upcoming.length}
            countClass="bg-signal-light/50 text-signal"
          />
          <div className="p-6 pt-2">
            {upcoming.length === 0 && <p className={EMPTY}>Nothing scheduled.</p>}
            <ul className="divide-y divide-line">
              {upcoming.map((b) => (
                <li key={b.id}>
                  <Link
                    href={`/admin/bookings/${b.id}`}
                    className="block rounded-lg px-2 py-3 -mx-2 transition-colors hover:bg-paper"
                  >
                    <p className="font-medium text-navy">{b.customer.name}</p>
                    <p className="text-sm text-steel">
                      {format(b.startAt, "MMM d, yyyy")} · {b.status}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className={`${CARD} animate-fade-up [animation-delay:120ms]`}>
          <CardHeader
            icon={<Truck className="h-4 w-4" strokeWidth={2.25} />}
            iconClass="bg-navy/10 text-navy"
            title="Out on rental"
            count={outUnits.length}
            countClass="bg-navy/10 text-navy"
          />
          <div className="p-6 pt-2">
            {outUnits.length === 0 && <p className={EMPTY}>Nothing out right now.</p>}
            <ul className="divide-y divide-line">
              {outUnits.map((u) => (
                <li key={u.id} className="py-3 text-sm">
                  <p className="font-medium text-navy">{u.item.name}</p>
                  <p className="text-steel">
                    {u.serialNumber}
                    {u.assignments[0] && ` · due back ${format(u.assignments[0].booking.endAt, "MMM d, h:mm a")}`}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className={`${CARD} animate-fade-up [animation-delay:180ms]`}>
          <CardHeader
            icon={<Wrench className="h-4 w-4" strokeWidth={2.25} />}
            iconClass="bg-navy-dark/10 text-navy-dark"
            title="In maintenance"
            count={maintenance.length}
            countClass="bg-navy-dark/10 text-navy-dark"
          />
          <div className="p-6 pt-2">
            {maintenance.length === 0 && <p className={EMPTY}>Nothing flagged.</p>}
            <ul className="divide-y divide-line">
              {maintenance.map((u) => (
                <li key={u.id} className="py-3 text-sm">
                  <p className="font-medium text-navy">{u.item.name}</p>
                  <p className="text-steel">{u.serialNumber}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className={`${CARD} animate-fade-up [animation-delay:240ms]`}>
          <CardHeader
            icon={<Target className="h-4 w-4" strokeWidth={2.25} />}
            iconClass="bg-steel/10 text-steel"
            title="Leads awaiting follow-up"
            count={dueLeadsFiltered.length}
            countClass="bg-steel/10 text-steel"
            href="/admin/leads"
          />
          <div className="p-6 pt-2">
            {dueLeadsFiltered.length === 0 && <p className={EMPTY}>Nothing due.</p>}
            <ul className="divide-y divide-line">
              {dueLeadsFiltered.map((l) => (
                <li key={l.id}>
                  <Link
                    href={`/admin/leads/${l.id}`}
                    className="block rounded-lg px-2 py-3 -mx-2 transition-colors hover:bg-paper"
                  >
                    <p className="font-medium text-navy">{l.name}</p>
                    <p className="text-sm text-steel">Follow up {format(l.followUpOn!, "MMM d, yyyy")}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
