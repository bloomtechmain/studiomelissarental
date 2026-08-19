import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

export default async function AdminQuotesPage() {
  const quotes = await prisma.quote.findMany({
    orderBy: { createdAt: "desc" },
    include: { customer: true, lead: true, lines: true },
    take: 100,
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-navy">Quotes</h1>
        <Link
          href="/admin/quotes/new"
          className="rounded-full bg-amber px-4 py-2 text-sm font-semibold text-amber-deep hover:brightness-95"
        >
          + New quote
        </Link>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-paper text-left text-xs uppercase tracking-wide text-steel">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">For</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {quotes.map((q) => {
              const total = q.lines.reduce((s, l) => s + Number(l.unitPrice) * l.quantity, 0);
              return (
                <tr key={q.id} className="hover:bg-paper/60">
                  <td className="px-4 py-3">
                    <Link href={`/admin/quotes/${q.id}`} className="text-navy hover:text-signal">
                      {format(q.createdAt, "MMM d, yyyy")}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-steel">{q.customer?.name ?? q.lead?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-steel">${total.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-paper px-2 py-1 text-xs font-semibold text-navy">
                      {q.status}
                    </span>
                  </td>
                </tr>
              );
            })}
            {quotes.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-steel">
                  No quotes yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
