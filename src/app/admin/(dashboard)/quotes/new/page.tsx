import { prisma } from "@/lib/prisma";
import NewQuoteForm from "./NewQuoteForm";

export const dynamic = "force-dynamic";

export default async function NewQuotePage({
  searchParams,
}: {
  searchParams: Promise<{ leadId?: string }>;
}) {
  const { leadId } = await searchParams;
  const [leads, customers, packages] = await Promise.all([
    prisma.lead.findMany({ where: { stage: { notIn: ["COMPLETED", "LOST"] } }, orderBy: { name: "asc" } }),
    prisma.customer.findMany({ orderBy: { name: "asc" } }),
    prisma.package.findMany({ where: { active: true }, orderBy: { tier: "asc" } }),
  ]);

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-navy">New quote</h1>
      <NewQuoteForm
        leads={leads.map((l) => ({ id: l.id, label: l.name }))}
        customers={customers.map((c) => ({ id: c.id, label: c.name }))}
        packages={packages.map((p) => ({ id: p.id, label: `Tier ${p.tier} — ${p.name}`, price: Number(p.price) }))}
        defaultLeadId={leadId}
      />
    </div>
  );
}
