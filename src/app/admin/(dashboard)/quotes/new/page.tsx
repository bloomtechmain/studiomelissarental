import { prisma } from "@/lib/prisma";
import { parse, isValid, format } from "date-fns";
import NewQuoteForm from "./NewQuoteForm";

export const dynamic = "force-dynamic";

// Lead.eventTimeSlot is free text (a formatted time like "8:00 AM", or one
// of the old MORNING/AFTERNOON values from before the rolling-pickup
// change) -- best-effort turn whatever's there into a 24h "HH:mm" for the
// pickup time input, so staff don't have to re-enter what the customer
// already told us.
function parseLeadTimeToPickupTime(raw: string | null): string | undefined {
  if (!raw) return undefined;
  if (raw === "MORNING") return "08:00";
  if (raw === "AFTERNOON") return "15:00";
  const parsed = parse(raw, "h:mm a", new Date());
  return isValid(parsed) ? format(parsed, "HH:mm") : undefined;
}

export default async function NewQuotePage({
  searchParams,
}: {
  searchParams: Promise<{ leadId?: string }>;
}) {
  const { leadId } = await searchParams;
  const [leads, customers, packages, lead] = await Promise.all([
    prisma.lead.findMany({ where: { stage: { notIn: ["COMPLETED", "LOST"] } }, orderBy: { name: "asc" } }),
    prisma.customer.findMany({ orderBy: { name: "asc" } }),
    prisma.package.findMany({ where: { active: true }, orderBy: { tier: "asc" } }),
    leadId ? prisma.lead.findUnique({ where: { id: leadId } }) : null,
  ]);

  // Carry over everything the customer already told us on the quote-request
  // form, so staff aren't re-typing (or missing) the package tier they
  // actually asked for -- this was previously silently dropped.
  const matchedPackage = lead?.recommendedTier
    ? packages.find((p) => p.name === lead.recommendedTier)
    : undefined;

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-navy">New quote</h1>
      <NewQuoteForm
        leads={leads.map((l) => ({ id: l.id, label: l.name }))}
        customers={customers.map((c) => ({ id: c.id, label: c.name }))}
        packages={packages.map((p) => ({ id: p.id, label: `Tier ${p.tier} — ${p.name}`, price: Number(p.price) }))}
        defaultLeadId={leadId}
        defaultPackageId={matchedPackage?.id}
        defaultEventName={lead?.eventName ?? undefined}
        defaultEventAddress={lead?.eventAddress ?? undefined}
        defaultEventDate={lead?.eventDate ? format(lead.eventDate, "yyyy-MM-dd") : undefined}
        defaultPickupTime={parseLeadTimeToPickupTime(lead?.eventTimeSlot ?? null)}
      />
    </div>
  );
}
