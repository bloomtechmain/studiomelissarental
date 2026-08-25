import Image from "next/image";
import { format } from "date-fns";
import { AlertTriangle } from "lucide-react";

type Line = { id: string; description: string; quantity: number; unitPrice: number };
type Contact = { name: string; email: string | null; phone: string | null } | null;

export default function QuoteDocument({
  createdAt,
  expiresAt,
  contact,
  eventName,
  eventDate,
  eventAddress,
  pickupLabel,
  lines,
}: {
  createdAt: Date;
  expiresAt: Date | null;
  contact: Contact;
  eventName: string | null;
  eventDate: Date | null;
  eventAddress: string | null;
  pickupLabel: string | null;
  lines: Line[];
}) {
  const total = lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
  const expired = expiresAt ? expiresAt.getTime() < Date.now() : false;

  return (
    <div className="mx-auto max-w-2xl bg-white px-8 py-12 text-navy print:px-0 print:py-0">
      {expired && (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-amber/40 bg-amber/10 px-4 py-3 text-sm font-medium text-amber-deep print:hidden">
          <AlertTriangle className="h-4 w-4 shrink-0" strokeWidth={2.25} />
          This quote has expired — pricing and availability are no longer guaranteed. Contact us
          for an updated quote.
        </div>
      )}

      <div className="flex items-start justify-between border-b border-line pb-6">
        <Image src="/logo.png" alt="Studio Melissa Rental" width={150} height={62} priority />
        <div className="text-right text-sm text-steel">
          <p className="font-display text-lg font-semibold text-navy">Quote</p>
          <p>{format(createdAt, "MMM d, yyyy")}</p>
          {expiresAt && <p>Expires {format(expiresAt, "MMM d, yyyy")}</p>}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-6 text-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-steel">Prepared for</p>
          <p className="mt-1 font-medium text-navy">{contact?.name ?? "—"}</p>
          {contact?.email && <p className="text-steel">{contact.email}</p>}
          {contact?.phone && <p className="text-steel">{contact.phone}</p>}
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-steel">Event</p>
          <p className="mt-1 text-navy">{eventName || "—"}</p>
          <p className="text-steel">
            {eventDate ? format(eventDate, "MMM d, yyyy") : "Date TBD"}
            {pickupLabel && ` · Pickup ${pickupLabel}`}
          </p>
          {eventAddress && <p className="text-steel">{eventAddress}</p>}
        </div>
      </div>

      <table className="mt-8 w-full text-sm">
        <thead>
          <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-steel">
            <th className="pb-2">Description</th>
            <th className="pb-2 text-center">Qty</th>
            <th className="pb-2 text-right">Unit price</th>
            <th className="pb-2 text-right">Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {lines.map((l) => (
            <tr key={l.id}>
              <td className="py-2.5 text-navy">{l.description}</td>
              <td className="py-2.5 text-center text-steel">{l.quantity}</td>
              <td className="py-2.5 text-right text-steel">${l.unitPrice.toFixed(2)}</td>
              <td className="py-2.5 text-right font-medium text-navy">
                ${(l.unitPrice * l.quantity).toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4 flex justify-end border-t-2 border-navy pt-3">
        <div className="flex w-48 justify-between font-display text-lg font-semibold text-navy">
          <span>Total</span>
          <span>${total.toFixed(2)}</span>
        </div>
      </div>

      <p className="mt-10 text-xs text-steel">
        This quote is an estimate and is not a confirmed booking. A booking is confirmed once a
        booking fee and signed rental agreement are on file, per the Studio Melissa Rental
        Equipment Rental Agreement.
      </p>
    </div>
  );
}
