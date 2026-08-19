import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  subMonths,
  format,
  isSameMonth,
  isToday,
  isSameDay,
} from "date-fns";

export const dynamic = "force-dynamic";

const STATUS_COLOR: Record<string, string> = {
  PENDING: "bg-amber/20 text-amber-deep border-amber/40",
  CONFIRMED: "bg-signal-light text-navy border-signal/40",
  OUT: "bg-navy text-white border-navy",
  RETURNED: "bg-line text-steel border-line",
  COMPLETED: "bg-line text-steel border-line",
  CANCELLED: "bg-red-50 text-red-700 border-red-200 line-through",
};

export default async function AdminCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month } = await searchParams;
  const anchor = month ? new Date(`${month}-01T00:00:00`) : new Date();
  const monthStart = startOfMonth(anchor);
  const monthEnd = endOfMonth(anchor);
  const gridStart = startOfWeek(monthStart);
  const gridEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const bookings = await prisma.booking.findMany({
    where: { startAt: { gte: gridStart, lte: gridEnd }, status: { not: "CANCELLED" } },
    include: { customer: true },
    orderBy: { startAt: "asc" },
  });

  const prevMonth = format(subMonths(monthStart, 1), "yyyy-MM");
  const nextMonth = format(addMonths(monthStart, 1), "yyyy-MM");

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-navy">
          {format(monthStart, "MMMM yyyy")}
        </h1>
        <div className="flex gap-2">
          <Link
            href={`/admin/calendar?month=${prevMonth}`}
            className="rounded border border-line px-3 py-1.5 text-sm text-navy hover:border-signal"
          >
            ← Prev
          </Link>
          <Link
            href={`/admin/calendar?month=${format(new Date(), "yyyy-MM")}`}
            className="rounded border border-line px-3 py-1.5 text-sm text-navy hover:border-signal"
          >
            Today
          </Link>
          <Link
            href={`/admin/calendar?month=${nextMonth}`}
            className="rounded border border-line px-3 py-1.5 text-sm text-navy hover:border-signal"
          >
            Next →
          </Link>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-7 overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div
            key={d}
            className="border-b border-line bg-paper px-3 py-2 text-xs font-semibold uppercase tracking-wide text-steel"
          >
            {d}
          </div>
        ))}
        {days.map((day) => {
          const dayBookings = bookings.filter((b) => isSameDay(b.startAt, day));
          return (
            <div
              key={day.toISOString()}
              className={`min-h-[110px] border-b border-r border-line p-2 last:border-r-0 ${
                isSameMonth(day, monthStart) ? "bg-white" : "bg-paper/50"
              }`}
            >
              <p
                className={`text-xs font-medium ${
                  isToday(day)
                    ? "inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber text-amber-deep"
                    : isSameMonth(day, monthStart)
                      ? "text-navy"
                      : "text-steel/50"
                }`}
              >
                {format(day, "d")}
              </p>
              <div className="mt-1 flex flex-col gap-1">
                {dayBookings.map((b) => (
                  <Link
                    key={b.id}
                    href={`/admin/bookings/${b.id}`}
                    className={`truncate rounded border px-1.5 py-0.5 text-[11px] font-medium ${
                      STATUS_COLOR[b.status] ?? "bg-paper text-navy border-line"
                    }`}
                    title={`${b.customer.name} · ${b.slot}`}
                  >
                    {b.slot === "MORNING" ? "AM" : "PM"} · {b.customer.name}
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-3 text-xs text-steel">
        {Object.entries(STATUS_COLOR).map(([status, cls]) => (
          <span key={status} className={`rounded border px-2 py-1 ${cls}`}>
            {status}
          </span>
        ))}
      </div>
    </div>
  );
}
