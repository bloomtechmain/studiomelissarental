import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { format, isPast, isToday } from "date-fns";
import type { LeadStage } from "@prisma/client";

export const dynamic = "force-dynamic";

const STAGES: LeadStage[] = ["NEW", "CONTACTED", "QUOTE_SENT", "BOOKING_CONFIRMED", "COMPLETED", "LOST"];
const STAGE_LABEL: Record<LeadStage, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  QUOTE_SENT: "Quote Sent",
  BOOKING_CONFIRMED: "Booking Confirmed",
  COMPLETED: "Completed",
  LOST: "Lost / Declined",
};

export default async function AdminLeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ stage?: string }>;
}) {
  const { stage } = await searchParams;
  const filter = stage && STAGES.includes(stage as LeadStage) ? (stage as LeadStage) : undefined;

  const [leads, dueFollowUps] = await Promise.all([
    prisma.lead.findMany({
      where: filter ? { stage: filter } : undefined,
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.lead.findMany({
      where: { followUpOn: { not: null }, stage: { notIn: ["COMPLETED", "LOST"] } },
      orderBy: { followUpOn: "asc" },
    }),
  ]);

  const dueToday = dueFollowUps.filter((l) => l.followUpOn && (isPast(l.followUpOn) || isToday(l.followUpOn)));

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-navy">Leads</h1>
        <Link
          href="/admin/leads/new"
          className="rounded-full bg-amber px-4 py-2 text-sm font-semibold text-amber-deep hover:brightness-95"
        >
          + New lead
        </Link>
      </div>

      {dueToday.length > 0 && (
        <div className="mt-4 rounded-2xl border border-amber/40 bg-amber/10 p-4">
          <p className="text-sm font-semibold text-amber-deep">
            {dueToday.length} follow-up{dueToday.length === 1 ? "" : "s"} due today or overdue
          </p>
          <ul className="mt-2 space-y-1">
            {dueToday.map((l) => (
              <li key={l.id} className="text-sm">
                <Link href={`/admin/leads/${l.id}`} className="text-navy hover:text-signal">
                  {l.name}
                </Link>
                <span className="text-steel"> — {format(l.followUpOn!, "MMM d, yyyy")}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href="/admin/leads"
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            !filter ? "bg-navy text-white" : "border border-line bg-white text-steel"
          }`}
        >
          All
        </Link>
        {STAGES.map((s) => (
          <Link
            key={s}
            href={`/admin/leads?stage=${s}`}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              filter === s ? "bg-navy text-white" : "border border-line bg-white text-steel"
            }`}
          >
            {STAGE_LABEL[s]}
          </Link>
        ))}
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-paper text-left text-xs uppercase tracking-wide text-steel">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Event date</th>
              <th className="px-4 py-3">Stage</th>
              <th className="px-4 py-3">Follow up</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {leads.map((l) => (
              <tr key={l.id} className="hover:bg-paper/60">
                <td className="px-4 py-3">
                  <Link href={`/admin/leads/${l.id}`} className="text-navy hover:text-signal">
                    {l.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-steel">{l.source.replace("_", " ")}</td>
                <td className="px-4 py-3 text-steel">
                  {l.eventDate ? format(l.eventDate, "MMM d, yyyy") : "—"}
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-paper px-2 py-1 text-xs font-semibold text-navy">
                    {STAGE_LABEL[l.stage]}
                  </span>
                </td>
                <td className="px-4 py-3 text-steel">
                  {l.followUpOn ? format(l.followUpOn, "MMM d, yyyy") : "—"}
                </td>
              </tr>
            ))}
            {leads.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-steel">
                  No leads found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
