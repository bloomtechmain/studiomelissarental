"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { updateLeadStage, setLeadFollowUp, addLeadActivity, convertLeadToCustomer } from "../actions";
import type { LeadStage } from "@prisma/client";

const STAGES: LeadStage[] = ["NEW", "CONTACTED", "QUOTE_SENT", "BOOKING_CONFIRMED", "COMPLETED", "LOST"];
const STAGE_LABEL: Record<LeadStage, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  QUOTE_SENT: "Quote Sent",
  BOOKING_CONFIRMED: "Booking Confirmed",
  COMPLETED: "Completed",
  LOST: "Lost / Declined",
};

export default function LeadPanel({
  leadId,
  stage,
  followUpOn,
  customerId,
}: {
  leadId: string;
  stage: LeadStage;
  followUpOn: string | null;
  customerId: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [note, setNote] = useState("");
  const [followUp, setFollowUp] = useState(followUpOn ?? "");

  function changeStage(next: LeadStage) {
    startTransition(async () => {
      await updateLeadStage(leadId, next);
      router.refresh();
    });
  }

  function saveFollowUp() {
    startTransition(async () => {
      await setLeadFollowUp(leadId, followUp || null);
      router.refresh();
    });
  }

  function submitNote(e: React.FormEvent) {
    e.preventDefault();
    if (!note.trim()) return;
    startTransition(async () => {
      await addLeadActivity(leadId, "note", note.trim());
      setNote("");
      router.refresh();
    });
  }

  function handleConvert() {
    startTransition(async () => {
      await convertLeadToCustomer(leadId);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-navy">Pipeline stage</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {STAGES.map((s) => (
            <button
              key={s}
              disabled={pending}
              onClick={() => changeStage(s)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold disabled:opacity-50 ${
                stage === s ? "bg-navy text-white" : "border border-line text-steel hover:border-signal"
              }`}
            >
              {STAGE_LABEL[s]}
            </button>
          ))}
        </div>

        <div className="mt-4 flex items-end gap-2 border-t border-line pt-4">
          <label className="flex flex-col gap-1 text-sm font-medium text-navy">
            Follow up on
            <input
              type="date"
              value={followUp}
              onChange={(e) => setFollowUp(e.target.value)}
              className="rounded border border-line px-3 py-1.5 text-sm"
            />
          </label>
          <button
            disabled={pending}
            onClick={saveFollowUp}
            className="rounded border border-line px-3 py-1.5 text-sm text-navy hover:border-signal disabled:opacity-50"
          >
            Save
          </button>
        </div>

        <div className="mt-4 border-t border-line pt-4">
          {customerId ? (
            <Link href={`/admin/customers/${customerId}`} className="text-sm font-semibold text-signal">
              View linked customer →
            </Link>
          ) : (
            <button
              disabled={pending}
              onClick={handleConvert}
              className="rounded-full bg-amber px-4 py-2 text-sm font-semibold text-amber-deep hover:brightness-95 disabled:opacity-50"
            >
              Convert to customer
            </button>
          )}
          <Link
            href={`/admin/quotes/new?leadId=${leadId}`}
            className="ml-3 text-sm font-semibold text-signal"
          >
            Create quote →
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-navy">Activity log</h2>
        <form onSubmit={submitNote} className="mt-3 flex gap-2">
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Log a call, email, or note…"
            className="flex-1 rounded border border-line px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={pending}
            className="rounded bg-navy px-4 py-2 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-50"
          >
            Add
          </button>
        </form>
      </div>
    </div>
  );
}
