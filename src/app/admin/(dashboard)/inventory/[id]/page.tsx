import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { toDateStr } from "@/lib/rental";
import EditItemForm from "./EditItemForm";
import UnitsPanel from "./UnitsPanel";

export const dynamic = "force-dynamic";

export default async function AdminItemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [item, categories] = await Promise.all([
    prisma.item.findUnique({
      where: { id },
      include: {
        units: {
          orderBy: { serialNumber: "asc" },
          include: { maintenance: { orderBy: { createdAt: "desc" } } },
        },
      },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);
  if (!item) notFound();

  // A unit still shows AVAILABLE in its manually-set status field even once
  // it's earmarked for an upcoming booking — status is a physical/manual
  // toggle, not auto-synced (see availability.ts). "Reserved" is instead
  // computed here at read time from any live (non-cancelled — cancellation
  // deletes its BookingUnit rows immediately) future assignment, the same
  // way real-time availability itself is computed rather than stored.
  const reservedUnitIds = new Set(
    (
      await prisma.bookingUnit.findMany({
        where: { unitId: { in: item.units.map((u) => u.id) }, blockedUntil: { gt: new Date() } },
        select: { unitId: true },
      })
    ).map((b) => b.unitId)
  );

  return (
    <div>
      <Link href="/admin/inventory" className="text-sm text-signal">
        ← Inventory
      </Link>
      <h1 className="mt-2 font-display text-2xl font-semibold text-navy">{item.name}</h1>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <EditItemForm
          item={{
            id: item.id,
            name: item.name,
            categoryId: item.categoryId,
            description: item.description,
            dailyRate: Number(item.dailyRate),
            bufferHours: item.bufferHours,
            active: item.active,
            photoUrl: item.photoUrl,
          }}
          categories={categories}
        />
        <UnitsPanel
          itemId={item.id}
          units={item.units.map((u) => ({
            id: u.id,
            serialNumber: u.serialNumber,
            status: u.status,
            notes: u.notes,
            purchaseDate: u.purchaseDate ? toDateStr(u.purchaseDate) : null,
            purchaseCost: u.purchaseCost !== null ? Number(u.purchaseCost) : null,
            reserved: reservedUnitIds.has(u.id),
            maintenance: u.maintenance.map((m) => ({
              id: m.id,
              description: m.description,
              resolved: m.resolved,
              resolvedBy: m.resolvedBy,
              createdAt: m.createdAt,
              resolvedAt: m.resolvedAt,
            })),
          }))}
        />
      </div>
    </div>
  );
}
