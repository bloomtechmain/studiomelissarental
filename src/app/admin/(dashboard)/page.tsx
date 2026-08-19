import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { format, isPast, isToday } from "date-fns";
import { Clock3, CalendarClock, Truck, Wrench, Target } from "lucide-react";

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

  const CARD = "rounded-2xl border border-line bg-white p-6 shadow-sm";
  const ICON_WRAP = "flex h-9 w-9 items-center justify-center rounded-lg";

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-navy">Dashboard</h1>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <section className={CARD}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className={`${ICON_WRAP} bg-amber/15 text-amber-deep`}>
                <Clock3 className="h-4 w-4" strokeWidth={2.25} />
              </span>
              <h2 className="font-semibold text-navy">Pending confirmation</h2>
            </div>
            <Link href="/admin/bookings" className="text-sm font-semibold text-signal">
              View all
            </Link>
          </div>
          <ul className="mt-3 divide-y divide-line">
            {pending.length === 0 && <p className="py-3 text-sm text-steel">Nothing pending.</p>}
            {pending.map((b) => (
              <li key={b.id} className="py-3">
                <Link href={`/admin/bookings/${b.id}`} className="block hover:text-signal">
                  <p className="font-medium text-navy">{b.customer.name}</p>
                  <p className="text-sm text-steel">
                    {format(b.startAt, "MMM d, yyyy")} · {b.eventName || "Untitled event"}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className={CARD}>
          <div className="flex items-center gap-2.5">
            <span className={`${ICON_WRAP} bg-signal-light/50 text-signal`}>
              <CalendarClock className="h-4 w-4" strokeWidth={2.25} />
            </span>
            <h2 className="font-semibold text-navy">Upcoming (next 7 days)</h2>
          </div>
          <ul className="mt-3 divide-y divide-line">
            {upcoming.length === 0 && <p className="py-3 text-sm text-steel">Nothing scheduled.</p>}
            {upcoming.map((b) => (
              <li key={b.id} className="py-3">
                <Link href={`/admin/bookings/${b.id}`} className="block hover:text-signal">
                  <p className="font-medium text-navy">{b.customer.name}</p>
                  <p className="text-sm text-steel">
                    {format(b.startAt, "MMM d, yyyy")} · {b.status}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className={CARD}>
          <div className="flex items-center gap-2.5">
            <span className={`${ICON_WRAP} bg-navy/10 text-navy`}>
              <Truck className="h-4 w-4" strokeWidth={2.25} />
            </span>
            <h2 className="font-semibold text-navy">Out on rental</h2>
          </div>
          <ul className="mt-3 divide-y divide-line">
            {outUnits.length === 0 && <p className="py-3 text-sm text-steel">Nothing out right now.</p>}
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
        </section>

        <section className={CARD}>
          <div className="flex items-center gap-2.5">
            <span className={`${ICON_WRAP} bg-red-50 text-red-600`}>
              <Wrench className="h-4 w-4" strokeWidth={2.25} />
            </span>
            <h2 className="font-semibold text-navy">In maintenance</h2>
          </div>
          <ul className="mt-3 divide-y divide-line">
            {maintenance.length === 0 && (
              <p className="py-3 text-sm text-steel">Nothing flagged.</p>
            )}
            {maintenance.map((u) => (
              <li key={u.id} className="py-3 text-sm">
                <p className="font-medium text-navy">{u.item.name}</p>
                <p className="text-steel">{u.serialNumber}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className={CARD}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className={`${ICON_WRAP} bg-steel/10 text-steel`}>
                <Target className="h-4 w-4" strokeWidth={2.25} />
              </span>
              <h2 className="font-semibold text-navy">Leads awaiting follow-up</h2>
            </div>
            <Link href="/admin/leads" className="text-sm font-semibold text-signal">
              View all
            </Link>
          </div>
          <ul className="mt-3 divide-y divide-line">
            {dueLeadsFiltered.length === 0 && <p className="py-3 text-sm text-steel">Nothing due.</p>}
            {dueLeadsFiltered.map((l) => (
              <li key={l.id} className="py-3">
                <Link href={`/admin/leads/${l.id}`} className="block hover:text-signal">
                  <p className="font-medium text-navy">{l.name}</p>
                  <p className="text-sm text-steel">Follow up {format(l.followUpOn!, "MMM d, yyyy")}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
