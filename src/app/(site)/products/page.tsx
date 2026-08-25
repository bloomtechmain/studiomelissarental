import { prisma } from "@/lib/prisma";
import EquipmentCatalog from "@/components/EquipmentCatalog";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: {
      items: {
        where: { active: true },
        orderBy: { name: "asc" },
        include: { units: { where: { status: { in: ["AVAILABLE", "OUT"] } } } },
      },
    },
  });

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <div className="max-w-xl">
        <h1 className="font-display text-3xl font-semibold text-navy">Products</h1>
        <p className="mt-2 text-steel">
          Individual equipment for your own build — pick it up from us, no delivery included.
        </p>
      </div>

      <div className="mt-8">
        <EquipmentCatalog
          categories={categories
            .filter((cat) => cat.items.length > 0)
            .map((cat) => ({
              id: cat.id,
              name: cat.name,
              items: cat.items.map((item) => ({
                id: item.id,
                name: item.name,
                dailyRate: Number(item.dailyRate),
                unitCount: item.units.length,
              })),
            }))}
        />
      </div>
    </div>
  );
}
