import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import PackageEditor from "./PackageEditor";

export const dynamic = "force-dynamic";

export default async function AdminPackageDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [pkg, items] = await Promise.all([
    prisma.package.findUnique({
      where: { id },
      include: { components: { include: { item: true } } },
    }),
    prisma.item.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      include: { units: true },
    }),
  ]);
  if (!pkg) notFound();

  return (
    <div>
      <Link href="/admin/packages" className="text-sm text-signal">
        ← Packages
      </Link>
      <h1 className="mt-2 font-display text-2xl font-semibold text-navy">
        Tier {pkg.tier} — {pkg.name}
      </h1>

      <div className="mt-6">
        <PackageEditor
          packageId={pkg.id}
          description={pkg.description ?? ""}
          price={Number(pkg.price)}
          active={pkg.active}
          components={pkg.components.map((c) => ({
            id: c.id,
            itemId: c.itemId,
            itemName: c.item.name,
            quantity: c.quantity,
          }))}
          items={items.map((i) => ({ id: i.id, name: i.name, unitCount: i.units.length }))}
        />
      </div>
    </div>
  );
}
