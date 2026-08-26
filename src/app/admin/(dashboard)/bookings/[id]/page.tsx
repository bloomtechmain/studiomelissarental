import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import BookingStatusActions from "./BookingStatusActions";
import PaymentPanel from "./PaymentPanel";
import OnlinePaymentPanel from "./OnlinePaymentPanel";
import AgreementPanel from "./AgreementPanel";
import ChargesPanel from "./ChargesPanel";
import RefundPanel from "./RefundPanel";
import RescheduleForm from "./RescheduleForm";
import SwapUnitControl from "./SwapUnitControl";
import ChecklistPanel from "./ChecklistPanel";
import { getBookingFeePercent } from "@/lib/settings";
import { computeCancellationRefund } from "@/lib/cancellation";
import { toDateStr } from "@/lib/rental";
import { decryptSignatureCode } from "@/lib/signatureEncryption";

export const dynamic = "force-dynamic";

export default async function AdminBookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [booking, bookingFeePercent, addOns, auditLog] = await Promise.all([
    prisma.booking.findUnique({
      where: { id },
      include: {
        customer: true,
        package: true,
        lines: { include: { item: true } },
        units: { include: { unit: { include: { item: true } } } },
        charges: { orderBy: { createdAt: "asc" } },
        stripePayments: { orderBy: { createdAt: "desc" } },
      },
    }),
    getBookingFeePercent(),
    prisma.addOn.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.auditLog.findMany({
      where: { entity: "Booking", entityId: id },
      orderBy: { createdAt: "desc" },
      include: { actor: true },
      take: 20,
    }),
  ]);
  if (!booking) notFound();

  let decryptedSignature: string | null = null;
  if (booking.signatureHash) {
    try {
      decryptedSignature = decryptSignatureCode(booking.signatureHash);
    } catch {
      decryptedSignature = null;
    }
  }

  const chargesTotal = booking.charges.reduce((s, c) => s + Number(c.unitPrice) * c.quantity, 0);
  const balanceDue =
    Number(booking.rentalFee) + Number(booking.securityDeposit) + chargesTotal - Number(booking.amountPaid);
  const bookingFeeAmount = Math.round(Number(booking.rentalFee) * (bookingFeePercent / 100) * 100) / 100;
  const showCancellationReference = !["CANCELLED", "COMPLETED"].includes(booking.status);
  const refund = computeCancellationRefund({
    startAt: booking.startAt,
    rentalFee: Number(booking.rentalFee),
    securityDeposit: Number(booking.securityDeposit),
    bookingFeePercent,
  });
  const canReschedule = !["COMPLETED", "CANCELLED"].includes(booking.status);
  const isLateReturn = booking.returnedAt !== null && booking.returnedAt > booking.endAt;

  return (
    <div className="max-w-3xl">
      <Link href="/admin/bookings" className="text-sm text-signal">
        ← All bookings
      </Link>

      <div className="mt-3 flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-navy">
            {booking.eventName || "Untitled event"}
          </h1>
          <p className="mt-1 text-steel">
            Pickup {format(booking.pickupAt, "EEEE, MMM d 'at' h:mm a")} · Return due{" "}
            {format(booking.endAt, "MMM d 'at' h:mm a")} ·{" "}
            {booking.fulfillmentType === "DELIVERY" ? "We deliver" : "Customer pickup"}
          </p>
        </div>
        <span className="rounded-full bg-paper px-3 py-1 text-sm font-semibold text-navy">
          {booking.status}
        </span>
      </div>

      {isLateReturn && (
        <div className="mt-4 rounded-lg border border-amber/40 bg-amber/10 px-4 py-3 text-sm font-medium text-amber-deep">
          Returned late ({format(booking.returnedAt!, "MMM d 'at' h:mm a")}, due{" "}
          {format(booking.endAt, "MMM d 'at' h:mm a")}).
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <BookingStatusActions bookingId={booking.id} status={booking.status} />
        {canReschedule && (
          <RescheduleForm
            bookingId={booking.id}
            currentDate={toDateStr(booking.pickupAt)}
            currentTime={format(booking.pickupAt, "HH:mm")}
          />
        )}
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <section className="rounded-2xl border border-line bg-white shadow-sm p-5">
          <h2 className="font-semibold text-navy">Customer</h2>
          <p className="mt-2 text-navy">{booking.customer.name}</p>
          {booking.customer.org && <p className="text-steel">{booking.customer.org}</p>}
          {booking.customer.phone && <p className="text-steel">{booking.customer.phone}</p>}
          {booking.customer.email && <p className="text-steel">{booking.customer.email}</p>}
          <Link
            href={`/admin/customers/${booking.customer.id}`}
            className="mt-2 inline-block text-sm text-signal"
          >
            View customer →
          </Link>
        </section>

        <section className="rounded-2xl border border-line bg-white shadow-sm p-5">
          <h2 className="font-semibold text-navy">Event</h2>
          <p className="mt-2 text-steel">{booking.eventAddress || "No address given"}</p>
          {booking.package && <p className="mt-2 text-steel">Package: {booking.package.name}</p>}
          {booking.notes && <p className="mt-2 text-steel">Notes: {booking.notes}</p>}
        </section>

        <PaymentPanel
          bookingId={booking.id}
          bookingFeePercent={bookingFeePercent}
          rentalFee={Number(booking.rentalFee)}
          securityDeposit={Number(booking.securityDeposit)}
          amountPaid={Number(booking.amountPaid)}
          paymentMethod={booking.paymentMethod}
          chargesTotal={chargesTotal}
          status={booking.status}
          depositOverridden={booking.depositOverridden}
        />

        <OnlinePaymentPanel
          bookingId={booking.id}
          balanceDue={balanceDue}
          bookingFeeAmount={bookingFeeAmount}
          amountPaid={Number(booking.amountPaid)}
          payments={booking.stripePayments.map((p) => ({
            id: p.id,
            amount: Number(p.amount),
            status: p.status,
            createdAt: p.createdAt,
          }))}
        />

        <AgreementPanel
          bookingId={booking.id}
          agreementSigned={booking.agreementSigned}
          agreementSignedAt={booking.agreementSignedAt}
          agreementOverridden={booking.agreementOverridden}
          insuranceOnFile={booking.insuranceOnFile}
          agreementFileUrl={booking.agreementFileUrl}
          agreementFileName={booking.agreementFileName}
          signatureName={booking.signatureName}
          signatureHash={booking.signatureHash}
          signatureIp={booking.signatureIp}
          signatureImageUrl={booking.signatureImageUrl}
          decryptedSignature={decryptedSignature}
        />

        <ChecklistPanel
          bookingId={booking.id}
          eventAddress={booking.eventAddress}
          fulfillmentType={booking.fulfillmentType}
          pickupWindowLabel={format(booking.pickupAt, "MMM d, yyyy 'at' h:mm a")}
          dropoffWindowLabel={format(booking.endAt, "MMM d, yyyy 'at' h:mm a")}
          siteContactName={booking.siteContactName}
          siteContactPhone={booking.siteContactPhone}
          loadInNotes={booking.loadInNotes}
        />

        <ChargesPanel
          bookingId={booking.id}
          charges={booking.charges.map((c) => ({
            id: c.id,
            description: c.description,
            quantity: c.quantity,
            unitPrice: Number(c.unitPrice),
          }))}
          addOns={addOns.map((a) => ({ id: a.id, name: a.name, price: Number(a.price) }))}
        />

        {booking.status === "CANCELLED" && (
          <RefundPanel
            bookingId={booking.id}
            refundIssued={Number(booking.refundIssued)}
            refundNote={booking.refundNote}
            refundedAt={booking.refundedAt}
            suggestedRefund={refund.totalRefund}
          />
        )}
      </div>

      {showCancellationReference && (
        <section className="mt-6 rounded-2xl border border-line bg-white shadow-sm p-5">
          <h2 className="font-semibold text-navy">Cancellation policy — if cancelled today</h2>
          <p className="mt-1 text-xs text-steel">
            Reference only, per the rental agreement — nothing is refunded automatically.{" "}
            {refund.daysUntilEvent >= 0
              ? `${refund.daysUntilEvent} day(s) until the event.`
              : "Event date has passed."}
          </p>
          <p className="mt-2 text-sm font-medium text-navy">{refund.tierLabel}</p>
          <dl className="mt-2 space-y-1 text-sm">
            <div className="flex justify-between">
              <dt className="text-steel">Rental fee refund</dt>
              <dd className="text-navy">${refund.rentalFeeRefund.toFixed(2)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-steel">Security deposit refund</dt>
              <dd className="text-navy">${refund.depositRefund.toFixed(2)}</dd>
            </div>
            <div className="flex justify-between font-semibold">
              <dt className="text-navy">Total suggested refund</dt>
              <dd className="text-navy">${refund.totalRefund.toFixed(2)}</dd>
            </div>
          </dl>
        </section>
      )}

      <section className="mt-6 rounded-2xl border border-line bg-white shadow-sm p-5">
        <h2 className="font-semibold text-navy">Equipment assigned (pull sheet)</h2>
        <table className="mt-3 w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wide text-steel">
            <tr>
              <th className="py-1">Item</th>
              <th className="py-1">Serial number</th>
              <th className="py-1"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {booking.units.map((bu) => (
              <tr key={bu.id}>
                <td className="py-1.5 text-navy">{bu.unit.item.name}</td>
                <td className="py-1.5 text-steel">{bu.unit.serialNumber}</td>
                <td className="py-1.5 text-right">
                  <SwapUnitControl
                    bookingUnitId={bu.id}
                    canSwap={["PENDING", "CONFIRMED", "PAID_IN_FULL"].includes(booking.status)}
                  />
                </td>
              </tr>
            ))}
            {booking.units.length === 0 && (
              <tr>
                <td colSpan={3} className="py-3 text-steel">
                  No units assigned.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      {auditLog.length > 0 && (
        <section className="mt-6 rounded-2xl border border-line bg-white shadow-sm p-5">
          <h2 className="font-semibold text-navy">History</h2>
          <ul className="mt-3 space-y-2">
            {auditLog.map((a) => (
              <li key={a.id} className="border-l-2 border-line pl-3 text-sm">
                <p className="text-navy">{a.detail}</p>
                <p className="text-xs text-steel">
                  {format(a.createdAt, "MMM d, yyyy h:mm a")} {a.actor && `· ${a.actor.name}`}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
