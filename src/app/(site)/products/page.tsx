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

  const activeCategories = categories.filter((cat) => cat.items.length > 0);
  const totalItems = activeCategories.reduce((n, cat) => n + cat.items.length, 0);
  const totalUnits = activeCategories.reduce(
    (n, cat) => n + cat.items.reduce((m, item) => m + item.units.length, 0),
    0
  );

  return (
    <div>
      <section className="bg-dot-grid relative overflow-hidden border-b border-line bg-signal-light/20">
        <div className="pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_70%_60%_at_15%_0%,black,transparent)]" />
        <div className="relative mx-auto max-w-6xl px-6 py-16">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-xl">
              <p className="tier-pill">Self pickup</p>
              <h1 className="mt-4 font-display text-4xl font-semibold text-navy sm:text-5xl">
                Products
              </h1>
              <p className="mt-3 text-lg text-steel">
                Individual equipment for your own build — pick it up from us, no delivery
                included.
              </p>
            </div>
            <div className="flex shrink-0 gap-3">
              <div className="rounded-2xl border border-line bg-white px-6 py-4 text-center shadow-sm">
                <p className="font-display text-2xl font-semibold text-navy">{totalItems}</p>
                <p className="mt-1 text-xs font-semibold tracking-wide text-steel uppercase">
                  Items
                </p>
              </div>
              <div className="rounded-2xl border border-line bg-white px-6 py-4 text-center shadow-sm">
                <p className="font-display text-2xl font-semibold text-navy">{totalUnits}</p>
                <p className="mt-1 text-xs font-semibold tracking-wide text-steel uppercase">
                  Units in stock
                </p>
              </div>
              <div className="rounded-2xl border border-line bg-white px-6 py-4 text-center shadow-sm">
                <p className="font-display text-2xl font-semibold text-navy">
                  {activeCategories.length}
                </p>
                <p className="mt-1 text-xs font-semibold tracking-wide text-steel uppercase">
                  Categories
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-6 py-12">
        <EquipmentCatalog
          categories={activeCategories.map((cat) => ({
            id: cat.id,
            name: cat.name,
            items: cat.items.map((item) => ({
              id: item.id,
              name: item.name,
              dailyRate: Number(item.dailyRate),
              unitCount: item.units.length,
              photoUrl: item.photoUrl,
            })),
          }))}
        />
      </div>
    </div>
  );
}
