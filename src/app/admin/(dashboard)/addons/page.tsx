import { prisma } from "@/lib/prisma";
import AddOnsClient from "./AddOnsClient";

export const dynamic = "force-dynamic";

export default async function AdminAddOnsPage() {
  const addOns = await prisma.addOn.findMany({ orderBy: { name: "asc" } });

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-navy">Add-ons</h1>
      <p className="mt-1 text-sm text-steel">
        Extra line items (mics, monitors, lighting, travel surcharge) staff can attach to a quote
        or booking beyond the base package.
      </p>
      <div className="mt-6">
        <AddOnsClient
          addOns={addOns.map((a) => ({ id: a.id, name: a.name, price: Number(a.price), active: a.active }))}
        />
      </div>
    </div>
  );
}
