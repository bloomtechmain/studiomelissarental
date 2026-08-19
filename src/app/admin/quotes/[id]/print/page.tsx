import { notFound } from "next/navigation";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

export default async function QuotePrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const quote = await prisma.quote.findUnique({
    where: { id },
    include: { lines: true, customer: true, lead: true },
  });
  if (!quote) notFound();

  const total = quote.lines.reduce((s, l) => s + Number(l.unitPrice) * l.quantity, 0);
  const contact = quote.customer ?? quote.lead;

  return (
    <div className="mx-auto max-w-2xl bg-white px-8 py-12 text-navy print:px-0 print:py-0">
      <div className="flex items-start justify-between border-b border-line pb-6">
        <Image src="/logo.png" alt="Studio Melissa Rental" width={150} height={62} priority />
        <div className="text-right text-sm text-steel">
          <p className="font-display text-lg font-semibold text-navy">Quote</p>
          <p>{format(quote.createdAt, "MMM d, yyyy")}</p>
          {quote.expiresAt && <p>Expires {format(quote.expiresAt, "MMM d, yyyy")}</p>}
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
          <p className="mt-1 text-navy">{quote.eventName || "—"}</p>
          <p className="text-steel">
            {quote.eventDate ? format(quote.eventDate, "MMM d, yyyy") : "Date TBD"}
            {quote.slot && ` · ${quote.slot === "MORNING" ? "8:00 AM – 6:00 PM" : "3:00 PM – 12:00 AM"}`}
          </p>
          {quote.eventAddress && <p className="text-steel">{quote.eventAddress}</p>}
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
          {quote.lines.map((l) => (
            <tr key={l.id}>
              <td className="py-2.5 text-navy">{l.description}</td>
              <td className="py-2.5 text-center text-steel">{l.quantity}</td>
              <td className="py-2.5 text-right text-steel">${Number(l.unitPrice).toFixed(2)}</td>
              <td className="py-2.5 text-right font-medium text-navy">
                ${(Number(l.unitPrice) * l.quantity).toFixed(2)}
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
