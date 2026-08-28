import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { decryptSignatureCode } from "@/lib/signatureEncryption";
import { getCompanySignatureUrl } from "@/lib/settings";

// Lead.eventTimeSlot is a legacy free-text pre-qualification field (kept
// as-is — see the rolling-pickup migration plan) with just these two
// historical values; not the same concept as a Booking's pickupAt anymore.
const LEAD_TIME_SLOT_LABEL: Record<string, string> = {
  MORNING: "8:00 AM – 6:00 PM",
  AFTERNOON: "3:00 PM – 12:00 AM",
};
import SignatureBlock from "@/components/SignatureBlock";
import LeadPanel from "./LeadPanel";
import CountersignButton from "./CountersignButton";
import SectionHeader from "@/components/admin/SectionHeader";
import { CalendarDays, FileText, PenTool, History } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminLeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [lead, companySignatureUrl] = await Promise.all([
    prisma.lead.findUnique({
      where: { id },
      include: {
        activities: { orderBy: { createdAt: "desc" }, include: { staff: true } },
        quotes: true,
        companySignedBy: true,
      },
    }),
    getCompanySignatureUrl(),
  ]);
  if (!lead) notFound();

  let decryptedSignature: string | null = null;
  if (lead.signatureCode) {
    try {
      decryptedSignature = decryptSignatureCode(lead.signatureCode);
    } catch {
      decryptedSignature = null;
    }
  }

  let decryptedCompanySignature: string | null = null;
  if (lead.companySignatureCode) {
    try {
      decryptedCompanySignature = decryptSignatureCode(lead.companySignatureCode);
    } catch {
      decryptedCompanySignature = null;
    }
  }

  return (
    <div className="max-w-3xl">
      <Link href="/admin/leads" className="text-sm text-signal">
        ← All leads
      </Link>
      <h1 className="mt-2 font-display text-2xl font-semibold text-navy">{lead.name}</h1>
      <p className="mt-1 text-steel">
        {lead.org && `${lead.org} · `}
        {lead.phone}
        {lead.phone && lead.email && " · "}
        {lead.email}
      </p>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <section className="rounded-2xl border border-line bg-white p-5 shadow-sm">
          <SectionHeader icon={CalendarDays}>Event details</SectionHeader>
          <dl className="mt-2 space-y-1 text-sm">
            <div className="flex justify-between">
              <dt className="text-steel">Event date</dt>
              <dd className="text-navy">{lead.eventDate ? format(lead.eventDate, "MMM d, yyyy") : "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-steel">Time slot</dt>
              <dd className="text-navy">
                {lead.eventTimeSlot ? LEAD_TIME_SLOT_LABEL[lead.eventTimeSlot] ?? lead.eventTimeSlot : "—"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-steel">Event name / venue</dt>
              <dd className="text-navy">{lead.eventName || "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-steel">Room size</dt>
              <dd className="text-navy">{lead.roomSize || "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-steel">Guest count</dt>
              <dd className="text-navy">{lead.guestCount ?? "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-steel">Recommended tier</dt>
              <dd className="text-navy">{lead.recommendedTier || "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-steel">Source</dt>
              <dd className="text-navy">{lead.source.replace("_", " ")}</dd>
            </div>
          </dl>
          {lead.eventAddress && <p className="mt-2 text-sm text-steel">{lead.eventAddress}</p>}
          {lead.notes && <p className="mt-2 text-sm text-steel">Notes: {lead.notes}</p>}
        </section>

        <section className="rounded-2xl border border-line bg-white p-5 shadow-sm">
          <SectionHeader icon={FileText}>Quotes</SectionHeader>
          <ul className="mt-2 space-y-1.5">
            {lead.quotes.map((q) => (
              <li key={q.id}>
                <Link href={`/admin/quotes/${q.id}`} className="text-sm text-signal">
                  Quote from {format(q.createdAt, "MMM d, yyyy")} — {q.status}
                </Link>
              </li>
            ))}
            {lead.quotes.length === 0 && <p className="text-sm text-steel">No quotes yet.</p>}
          </ul>
        </section>
      </div>

      {lead.signatureName && lead.signatureCode && (
        <section className="mt-6 rounded-2xl border border-line bg-white p-5 shadow-sm">
          <SectionHeader icon={PenTool}>Signature</SectionHeader>
          <div className={lead.signatureImageUrl ? "mt-3 grid gap-4 sm:grid-cols-2" : "mt-3"}>
            <SignatureBlock
              name={lead.signatureName}
              hash={lead.signatureCode}
              ip={lead.signatureIp ?? "unknown"}
              signedAt={lead.signedAt ? format(lead.signedAt, "MMM d, yyyy 'at' h:mm a") : undefined}
            />
            {lead.signatureImageUrl && (
              <img
                src={lead.signatureImageUrl}
                alt={`${lead.signatureName}'s signature`}
                className="w-full rounded-lg border border-line bg-white"
              />
            )}
          </div>
          <p className="mt-3 text-xs text-steel">
            Verified:{" "}
            {decryptedSignature ? (
              <span className="font-mono text-navy">{decryptedSignature}</span>
            ) : (
              "could not decrypt"
            )}
          </p>

          <div className="mt-5 border-t border-line pt-5">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-steel">
              Company countersignature
            </h3>
            {lead.companySignatureCode ? (
              <>
                <div className={companySignatureUrl ? "mt-3 grid gap-4 sm:grid-cols-2" : "mt-3"}>
                  <SignatureBlock
                    name="Studio Melissa Rental, LLC"
                    hash={lead.companySignatureCode}
                    ip="—"
                    signedAt={
                      lead.companySignedAt
                        ? format(lead.companySignedAt, "MMM d, yyyy 'at' h:mm a")
                        : undefined
                    }
                  />
                  {companySignatureUrl && (
                    <img
                      src={companySignatureUrl}
                      alt="Studio Melissa Rental, LLC signature"
                      className="w-full rounded-lg border border-line bg-white"
                    />
                  )}
                </div>
                <p className="mt-3 text-xs text-steel">
                  Countersigned by {lead.companySignedBy?.name ?? "unknown staff"}. Verified:{" "}
                  {decryptedCompanySignature ? (
                    <span className="font-mono text-navy">{decryptedCompanySignature}</span>
                  ) : (
                    "could not decrypt"
                  )}
                </p>
              </>
            ) : (
              <div className="mt-3">
                <p className="text-sm text-steel">Not yet countersigned by the company.</p>
                <CountersignButton leadId={lead.id} disabled={!companySignatureUrl} />
                {!companySignatureUrl && (
                  <p className="mt-1.5 text-xs text-amber-deep">
                    Upload a company signature in Settings first.
                  </p>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      <div className="mt-6">
        <LeadPanel
          leadId={lead.id}
          stage={lead.stage}
          followUpOn={lead.followUpOn ? format(lead.followUpOn, "yyyy-MM-dd") : null}
          customerId={lead.customerId}
        />
      </div>

      <section className="mt-6 rounded-2xl border border-line bg-white p-5 shadow-sm">
        <SectionHeader icon={History}>Timeline</SectionHeader>
        <ul className="mt-3 space-y-3">
          {lead.activities.map((a) => (
            <li key={a.id} className="border-l-2 border-line pl-3 text-sm">
              <p className="text-navy">{a.content}</p>
              <p className="text-xs text-steel">
                {format(a.createdAt, "MMM d, yyyy h:mm a")} {a.staff && `· ${a.staff.name}`}
              </p>
            </li>
          ))}
          {lead.activities.length === 0 && <p className="text-sm text-steel">No activity yet.</p>}
        </ul>
      </section>
    </div>
  );
}
