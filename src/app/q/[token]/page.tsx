import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import QuoteDocument from "@/components/QuoteDocument";
import { SLOTS, type SlotKey } from "@/lib/slots";

export const dynamic = "force-dynamic";

// Public, unauthenticated view of a quote — deliberately outside both the
// (site) route group (no site nav/footer chrome) and /admin (no auth wall,
// see proxy.ts's "/admin/:path*" matcher). Reachable only by knowing the
// unguessable shareToken (see generateShareToken in lib/tokens.ts).
export default async function SharedQuotePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const quote = await prisma.quote.findUnique({
    where: { shareToken: token },
    include: { lines: true, customer: true, lead: true },
  });
  if (!quote) notFound();

  return (
    <div className="min-h-screen bg-paper py-10">
      <QuoteDocument
        createdAt={quote.createdAt}
        expiresAt={quote.expiresAt}
        contact={quote.customer ?? quote.lead}
        eventName={quote.eventName}
        eventDate={quote.eventDate}
        eventAddress={quote.eventAddress}
        slotLabel={quote.slot ? SLOTS[quote.slot as SlotKey].label : null}
        lines={quote.lines.map((l) => ({
          id: l.id,
          description: l.description,
          quantity: l.quantity,
          unitPrice: Number(l.unitPrice),
        }))}
      />
    </div>
  );
}
