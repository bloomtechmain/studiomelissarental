import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import QuoteDocument from "@/components/QuoteDocument";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

export default async function QuotePrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const quote = await prisma.quote.findUnique({
    where: { id },
    include: { lines: true, customer: true, lead: true },
  });
  if (!quote) notFound();

  return (
    <QuoteDocument
      createdAt={quote.createdAt}
      expiresAt={quote.expiresAt}
      contact={quote.customer ?? quote.lead}
      eventName={quote.eventName}
      eventDate={quote.eventDate}
      eventAddress={quote.eventAddress}
      pickupLabel={quote.pickupAt ? format(quote.pickupAt, "h:mm a") : null}
      lines={quote.lines.map((l) => ({
        id: l.id,
        description: l.description,
        quantity: l.quantity,
        unitPrice: Number(l.unitPrice),
      }))}
    />
  );
}
