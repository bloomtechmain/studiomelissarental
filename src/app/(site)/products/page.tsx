import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { iconForCategory, imageForCategory } from "@/lib/categoryIcons";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: {
      items: {
        where: { active: true },
        include: { units: { where: { status: { in: ["AVAILABLE", "OUT"] } } } },
      },
    },
  });

  const activeCategories = categories.filter((cat) => cat.items.length > 0);

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
          <div className="max-w-xl">
            <p className="tier-pill bg-white/10 text-amber ring-1 ring-inset ring-white/15">
              Self pickup
            </p>
            <h1 className="mt-4 font-display text-4xl font-semibold text-white sm:text-5xl">
              Items for rent
            </h1>
            <p className="mt-3 text-lg leading-relaxed text-signal-light/80">
              For anyone building their own system instead of booking a package: rent
              individual pieces of equipment à la carte, pay online, and pick up or arrange
              delivery. Availability updates in real time.
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-6 pt-8">
        <p className="text-steel">
          Building your own setup? Pick a category below, then add exactly what you need to
          your cart and check out online. Availability shown is real-time.
        </p>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {activeCategories.map((cat) => {
            const Icon = iconForCategory(cat.name);
            const unitCount = cat.items.reduce((n, item) => n + item.units.length, 0);
            return (
              <Link
                key={cat.id}
                href={`/products/${cat.id}`}
                className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={imageForCategory(cat.name)}
                    alt={cat.name}
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy-dark/75 via-navy-dark/10 to-transparent" />
                  <span className="absolute bottom-3 left-3 flex h-9 w-9 items-center justify-center rounded-lg bg-white/90 text-signal shadow">
                    <Icon className="h-4.5 w-4.5" strokeWidth={2.25} />
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <p className="font-display text-xl font-semibold text-navy">{cat.name}</p>
                  <p className="mt-1 text-sm text-steel">
                    {cat.items.length} item{cat.items.length === 1 ? "" : "s"} · {unitCount} unit
                    {unitCount === 1 ? "" : "s"} in stock
                  </p>
                  <span className="mt-auto flex items-center gap-1 pt-5 text-sm font-semibold text-signal transition group-hover:gap-1.5 group-hover:text-navy">
                    View items
                    <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

        {activeCategories.length === 0 && (
          <p className="rounded-2xl border border-line bg-white py-12 text-center text-steel">
            No equipment categories are available right now.
          </p>
        )}
      </div>
    </div>
  );
}
