import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const customers = await prisma.customer.findMany({
    where: q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            { phone: { contains: q, mode: "insensitive" } },
            { org: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { bookings: true } } },
    take: 100,
  });

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-navy">Customers</h1>

      <form className="mt-4" method="get">
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search name, email, phone, organization…"
          className="w-full max-w-md rounded border border-line px-3 py-2 text-sm"
        />
      </form>

      <div className="mt-6 overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-paper text-left text-xs uppercase tracking-wide text-steel">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Organization</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Bookings</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {customers.map((c) => (
              <tr key={c.id} className="hover:bg-paper/60">
                <td className="px-4 py-3">
                  <Link href={`/admin/customers/${c.id}`} className="text-navy hover:text-signal">
                    {c.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-steel">{c.org ?? "—"}</td>
                <td className="px-4 py-3 text-steel">{c.phone ?? c.email ?? "—"}</td>
                <td className="px-4 py-3 text-steel">{c._count.bookings}</td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-steel">
                  No customers found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
