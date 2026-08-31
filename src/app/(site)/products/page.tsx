import Image from "next/image";
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
      <section className="relative isolate overflow-hidden bg-navy-dark">
        <Image
          src="/images/category-products.jpg"
          alt="Individual audio equipment organized on warehouse shelving"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-navy-dark via-navy-dark/85 to-navy-dark/40" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-navy-dark/95 via-navy-dark/50 to-transparent" />

        <div className="relative mx-auto max-w-6xl px-6 py-16">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-xl">
              <p className="tier-pill bg-white/10 text-amber ring-1 ring-inset ring-white/15">
                Self pickup
              </p>
              <h1 className="mt-4 font-display text-4xl font-semibold text-white sm:text-5xl">
                Products
              </h1>
              <p className="mt-3 text-lg leading-relaxed text-signal-light/80">
                For anyone building their own system instead of booking a package: rent
                individual pieces of equipment à la carte, pay online, and pick up or arrange
                delivery. Availability updates in real time.
              </p>
            </div>
            <div className="flex shrink-0 gap-3">
              <div className="rounded-2xl border border-white/15 bg-white/10 px-6 py-4 text-center backdrop-blur">
                <p className="font-display text-2xl font-semibold text-white">{totalItems}</p>
                <p className="mt-1 text-xs font-semibold tracking-wide text-signal-light/70 uppercase">
                  Items
                </p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 px-6 py-4 text-center backdrop-blur">
                <p className="font-display text-2xl font-semibold text-white">{totalUnits}</p>
                <p className="mt-1 text-xs font-semibold tracking-wide text-signal-light/70 uppercase">
                  Units in stock
                </p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 px-6 py-4 text-center backdrop-blur">
                <p className="font-display text-2xl font-semibold text-white">
                  {activeCategories.length}
                </p>
                <p className="mt-1 text-xs font-semibold tracking-wide text-signal-light/70 uppercase">
                  Categories
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-6 pt-8">
        <p className="text-steel">
          Building your own setup? Rent exactly what you need, add it to your cart, and check
          out online. Availability shown is real-time.
        </p>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-12">
        <EquipmentCatalog
          categories={activeCategories.map((cat) => ({
            id: cat.id,
            name: cat.name,
            items: cat.items.map((item) => ({
              id: item.id,
              name: item.name,
              description: item.description,
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
