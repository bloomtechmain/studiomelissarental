import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import type { BookingStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

const STATUSES: BookingStatus[] = [
  "PENDING",
  "CONFIRMED",
  "PAID_IN_FULL",
  "OUT",
  "RETURNED",
  "COMPLETED",
  "CANCELLED",
];

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const filter = status && STATUSES.includes(status as BookingStatus) ? (status as BookingStatus) : undefined;

  const bookings = await prisma.booking.findMany({
    where: filter ? { status: filter } : undefined,
    orderBy: { startAt: "desc" },
    include: { customer: true, package: true, lines: { include: { item: true } } },
    take: 100,
  });

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-navy">Bookings</h1>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href="/admin/bookings"
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            !filter ? "bg-navy text-white" : "bg-white text-steel border border-line"
          }`}
        >
          All
        </Link>
        {STATUSES.map((s) => (
          <Link
            key={s}
            href={`/admin/bookings?status=${s}`}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              filter === s ? "bg-navy text-white" : "bg-white text-steel border border-line"
            }`}
          >
            {s}
          </Link>
        ))}
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-paper text-left text-xs uppercase tracking-wide text-steel">
            <tr>
              <th className="px-4 py-3">Pickup</th>
              <th className="px-4 py-3">Return due</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Package / Items</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {bookings.map((b) => (
              <tr key={b.id} className="group hover:bg-paper/60">
                <td className="p-0">
                  <Link
                    href={`/admin/bookings/${b.id}`}
                    className="block px-4 py-3 text-navy group-hover:text-signal"
                  >
                    {format(b.startAt, "MMM d, h:mm a")}
                  </Link>
                </td>
                <td className="p-0">
                  <Link href={`/admin/bookings/${b.id}`} className="block px-4 py-3 text-steel">
                    {format(b.endAt, "MMM d, h:mm a")}
                  </Link>
                </td>
                <td className="p-0">
                  <Link href={`/admin/bookings/${b.id}`} className="block px-4 py-3 text-navy">
                    {b.customer.name}
                  </Link>
                </td>
                <td className="p-0">
                  <Link href={`/admin/bookings/${b.id}`} className="block px-4 py-3 text-steel">
                    {b.package?.name ?? b.lines.map((l) => `${l.quantity}× ${l.item.name}`).join(", ")}
                  </Link>
                </td>
                <td className="p-0">
                  <Link href={`/admin/bookings/${b.id}`} className="block px-4 py-3">
                    <span className="rounded-full bg-paper px-2 py-1 text-xs font-semibold text-navy">
                      {b.status}
                    </span>
                  </Link>
                </td>
              </tr>
            ))}
            {bookings.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-steel">
                  No bookings found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
