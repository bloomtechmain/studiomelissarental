import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminPackagesPage() {
  const packages = await prisma.package.findMany({
    orderBy: { tier: "asc" },
    include: { components: true },
  });

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-navy">Packages</h1>
      <p className="mt-1 text-sm text-steel">
        Edit each tier&apos;s price and equipment composition — this drives what customers see and
        can book on the public site.
      </p>

      <div className="mt-6 overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-paper text-left text-xs uppercase tracking-wide text-steel">
            <tr>
              <th className="px-4 py-3">Tier</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Components</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {packages.map((pkg) => (
              <tr key={pkg.id} className="hover:bg-paper/60">
                <td className="px-4 py-3">
                  <Link href={`/admin/packages/${pkg.id}`} className="text-navy hover:text-signal">
                    Tier {pkg.tier} — {pkg.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-steel">
                  {Number(pkg.price) > 0 ? `$${Number(pkg.price).toFixed(0)}` : "Custom quote"}
                </td>
                <td className="px-4 py-3 text-steel">
                  {pkg.components.length === 0 ? "None yet" : `${pkg.components.length} item(s)`}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-semibold ${
                      pkg.active ? "bg-signal-light text-navy" : "bg-line text-steel"
                    }`}
                  >
                    {pkg.active ? "Active" : "Inactive"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
