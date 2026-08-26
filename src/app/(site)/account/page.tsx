import { redirect } from "next/navigation";
import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { getCustomerSession } from "@/lib/customerAuth";
import AccountLogoutButton from "./AccountLogoutButton";
import { CalendarDays, PartyPopper } from "lucide-react";

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

const STATUS_STYLE: Record<string, string> = {
  PENDING: "bg-amber/15 text-amber-deep",
  CONFIRMED: "bg-signal-light/60 text-signal",
  PAID_IN_FULL: "bg-signal text-white",
  OUT: "bg-navy text-white",
  RETURNED: "border border-line bg-paper text-steel",
  COMPLETED: "border border-line bg-paper text-steel",
  CANCELLED: "bg-red-50 text-red-600",
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
    <div>
      <section className="bg-dot-grid relative overflow-hidden border-b border-line bg-paper">
        <div className="pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_70%_60%_at_15%_0%,black,transparent)]" />
        <div className="relative mx-auto max-w-4xl px-6 py-14">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="tier-pill">My account</p>
              <h1 className="mt-4 font-display text-4xl font-semibold text-navy">My rentals</h1>
              <p className="mt-2 text-steel">Welcome back, {session.name}.</p>
            </div>
            <AccountLogoutButton />
          </div>

          <p className="mt-6 inline-flex items-center rounded-full border border-line bg-white px-4 py-2 text-sm font-medium text-navy">
            You&apos;ve rented with us {bookings.length} time{bookings.length === 1 ? "" : "s"}.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="space-y-3">
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
        {bookings.map((b) => {
          const rentalFee = Number(b.rentalFee);
          const amountPaid = Number(b.amountPaid);
          const paidPct = rentalFee > 0 ? Math.min(100, (amountPaid / rentalFee) * 100) : 0;
          return (
            <div
              key={b.id}
              className="flex gap-4 rounded-2xl border border-line bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-signal-light/40 text-signal">
                <PartyPopper className="h-5 w-5" strokeWidth={2.25} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-navy">
                      {b.eventName || b.package?.name || "Rental"}
                    </p>
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-steel">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {format(b.date, "EEEE, MMM d, yyyy")}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      STATUS_STYLE[b.status] ?? "bg-paper text-navy"
                    }`}
                  >
                    {STATUS_LABEL[b.status] ?? b.status}
                  </span>
                </div>

                <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
                  <div className="flex gap-1.5">
                    <dt className="text-steel">Rental fee</dt>
                    <dd className="font-medium text-navy">${rentalFee.toFixed(2)}</dd>
                  </div>
                  <div className="flex gap-1.5">
                    <dt className="text-steel">Paid so far</dt>
                    <dd className="font-medium text-navy">${amountPaid.toFixed(2)}</dd>
                  </div>
                </dl>

                {rentalFee > 0 && (
                  <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-paper">
                    <div
                      className="h-full rounded-full bg-signal transition-all"
                      style={{ width: `${paidPct}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      </div>
    </div>
  );
}
