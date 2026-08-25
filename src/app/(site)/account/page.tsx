import { redirect } from "next/navigation";
import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { getCustomerSession } from "@/lib/customerAuth";
import AccountLogoutButton from "./AccountLogoutButton";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  PAID_IN_FULL: "Paid in full",
  OUT: "Out on rental",
  RETURNED: "Returned",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export default async function AccountDashboardPage() {
  const session = await getCustomerSession();
  if (!session) redirect("/account/login");

  const bookings = await prisma.booking.findMany({
    where: { customerId: session.id },
    orderBy: { createdAt: "desc" },
    include: { package: true },
  });

  return (
    <div className="mx-auto max-w-4xl px-6 py-14">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-navy">My rentals</h1>
          <p className="mt-2 text-steel">Welcome back, {session.name}.</p>
        </div>
        <AccountLogoutButton />
      </div>

      <p className="mt-6 inline-flex items-center rounded-full border border-line bg-white px-4 py-2 text-sm font-medium text-navy">
        You&apos;ve rented with us {bookings.length} time{bookings.length === 1 ? "" : "s"}.
      </p>

      <div className="mt-6 space-y-3">
        {bookings.length === 0 && (
          <p className="rounded-2xl border border-line bg-white p-6 text-steel">
            No rentals yet — browse our{" "}
            <a href="/services" className="font-semibold text-signal hover:underline">
              services
            </a>{" "}
            or{" "}
            <a href="/products" className="font-semibold text-signal hover:underline">
              products
            </a>{" "}
            to get started.
          </p>
        )}
        {bookings.map((b) => (
          <div key={b.id} className="rounded-2xl border border-line bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-navy">
                  {b.eventName || b.package?.name || "Rental"}
                </p>
                <p className="mt-1 text-sm text-steel">{format(b.date, "EEEE, MMM d, yyyy")}</p>
              </div>
              <span className="rounded-full bg-paper px-3 py-1 text-xs font-semibold text-navy">
                {STATUS_LABEL[b.status] ?? b.status}
              </span>
            </div>
            <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
              <div className="flex gap-1.5">
                <dt className="text-steel">Rental fee</dt>
                <dd className="font-medium text-navy">${Number(b.rentalFee).toFixed(2)}</dd>
              </div>
              <div className="flex gap-1.5">
                <dt className="text-steel">Paid so far</dt>
                <dd className="font-medium text-navy">${Number(b.amountPaid).toFixed(2)}</dd>
              </div>
            </dl>
          </div>
        ))}
      </div>
    </div>
  );
}
