import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import EditCustomerForm from "./EditCustomerForm";

export const dynamic = "force-dynamic";

export default async function AdminCustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      bookings: {
        orderBy: { startAt: "desc" },
        include: { package: true, lines: { include: { item: true } } },
      },
    },
  });
  if (!customer) notFound();

  return (
    <div>
      <Link href="/admin/customers" className="text-sm text-signal">
        ← Customers
      </Link>
      <h1 className="mt-2 font-display text-2xl font-semibold text-navy">{customer.name}</h1>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <EditCustomerForm
          customer={{
            id: customer.id,
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
            org: customer.org,
            notes: customer.notes,
            tags: customer.tags,
          }}
        />

        <section className="rounded-2xl border border-line bg-white shadow-sm p-5">
          <h2 className="font-semibold text-navy">Booking history</h2>
          <ul className="mt-3 divide-y divide-line">
            {customer.bookings.map((b) => (
              <li key={b.id} className="py-3">
                <Link href={`/admin/bookings/${b.id}`} className="block hover:text-signal">
                  <p className="font-medium text-navy">
                    {format(b.startAt, "MMM d, yyyy")} · {b.status}
                  </p>
                  <p className="text-sm text-steel">
                    {b.package?.name ?? b.lines.map((l) => `${l.quantity}× ${l.item.name}`).join(", ")}
                  </p>
                </Link>
              </li>
            ))}
            {customer.bookings.length === 0 && (
              <p className="py-3 text-sm text-steel">No bookings yet.</p>
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}
