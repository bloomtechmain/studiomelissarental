import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminInventoryPage() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { items: { orderBy: { name: "asc" }, include: { units: true } } },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-navy">Inventory</h1>
        <Link
          href="/admin/inventory/new"
          className="rounded bg-amber px-4 py-2 text-sm font-semibold text-amber-deep hover:brightness-95"
        >
          + New item
        </Link>
      </div>

      <div className="mt-6 space-y-8">
        {categories.map((cat) => (
          <section key={cat.id}>
            <h2 className="font-semibold text-navy">{cat.name}</h2>
            <div className="mt-2 overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-paper text-left text-xs uppercase tracking-wide text-steel">
                  <tr>
                    <th className="px-4 py-2">Item</th>
                    <th className="px-4 py-2">Daily rate</th>
                    <th className="px-4 py-2">Units</th>
                    <th className="px-4 py-2">Available</th>
                    <th className="px-4 py-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {cat.items.map((item) => {
                    const available = item.units.filter((u) => u.status === "AVAILABLE").length;
                    return (
                      <tr key={item.id} className="hover:bg-paper/60">
                        <td className="px-4 py-2">
                          <Link
                            href={`/admin/inventory/${item.id}`}
                            className="text-navy hover:text-signal"
                          >
                            {item.name}
                          </Link>
                        </td>
                        <td className="px-4 py-2 text-steel">${Number(item.dailyRate).toFixed(0)}</td>
                        <td className="px-4 py-2 text-steel">{item.units.length}</td>
                        <td className="px-4 py-2 text-steel">{available}</td>
                        <td className="px-4 py-2">
                          <span
                            className={`rounded-full px-2 py-1 text-xs font-semibold ${
                              item.active ? "bg-signal-light text-navy" : "bg-line text-steel"
                            }`}
                          >
                            {item.active ? "Active" : "Inactive"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {cat.items.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-4 text-steel">
                        No items in this category yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
