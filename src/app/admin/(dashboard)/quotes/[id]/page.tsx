import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import QuoteEditor from "./QuoteEditor";
import AttachCustomer from "./AttachCustomer";
import { FileCheck2, Printer } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminQuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [quote, customers, addOns] = await Promise.all([
    prisma.quote.findUnique({
      where: { id },
      include: { lines: true, customer: true, lead: true, package: true },
    }),
    prisma.customer.findMany({ orderBy: { name: "asc" } }),
    prisma.addOn.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ]);
  if (!quote) notFound();

  return (
    <div className="max-w-3xl">
      <Link href="/admin/quotes" className="text-sm text-signal">
        ← All quotes
      </Link>
      <div className="mt-2 flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-navy">
          Quote — {quote.eventName || quote.customer?.name || quote.lead?.name || "Untitled"}
        </h1>
        <a
          href={`/admin/quotes/${quote.id}/print`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-sm font-semibold text-navy hover:border-signal"
        >
          <Printer className="h-3.5 w-3.5" /> Print
        </a>
      </div>
      <p className="mt-1 text-steel">
        {quote.pickupAt ? format(quote.pickupAt, "MMM d, yyyy 'at' h:mm a") : "No pickup time set"}
        {quote.eventAddress && ` · ${quote.eventAddress}`}
      </p>

      {quote.lead?.signatureName && quote.lead?.signatureCode && (
        <p className="mt-3 flex items-center gap-1.5 text-sm font-medium text-signal">
          <FileCheck2 className="h-3.5 w-3.5" />
          Rental agreement already signed by {quote.lead.signatureName} at the quote-request stage
          — carries over automatically when this converts to a booking.
        </p>
      )}

      {!quote.customerId && (
        <div className="mt-4">
          <AttachCustomer quoteId={quote.id} status={quote.status} customers={customers.map((c) => ({ id: c.id, name: c.name }))} />
        </div>
      )}

      <div className="mt-6">
        <QuoteEditor
          quoteId={quote.id}
          status={quote.status}
          lines={quote.lines.map((l) => ({
            id: l.id,
            description: l.description,
            quantity: l.quantity,
            unitPrice: Number(l.unitPrice),
          }))}
          hasCustomer={Boolean(quote.customerId)}
          shareToken={quote.shareToken}
          addOns={addOns.map((a) => ({ id: a.id, name: a.name, price: Number(a.price) }))}
        />
      </div>

      {quote.bookingId && (
        <p className="mt-4 text-sm">
          <Link href={`/admin/bookings/${quote.bookingId}`} className="font-semibold text-signal">
            View converted booking →
          </Link>
        </p>
      )}
    </div>
  );
}
