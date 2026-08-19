"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateBookingChecklist } from "../../actions";
import { MapPin, Clock, User, Phone, ClipboardList } from "lucide-react";

export default function ChecklistPanel({
  bookingId,
  eventAddress,
  deliveryWindowLabel,
  pickupWindowLabel,
  siteContactName,
  siteContactPhone,
  loadInNotes,
}: {
  bookingId: string;
  eventAddress: string | null;
  deliveryWindowLabel: string;
  pickupWindowLabel: string;
  siteContactName: string | null;
  siteContactPhone: string | null;
  loadInNotes: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [contactName, setContactName] = useState(siteContactName ?? "");
  const [contactPhone, setContactPhone] = useState(siteContactPhone ?? "");
  const [notes, setNotes] = useState(loadInNotes ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaved(false);
    startTransition(async () => {
      await updateBookingChecklist(bookingId, {
        siteContactName: contactName,
        siteContactPhone: contactPhone,
        loadInNotes: notes,
      });
      setSaved(true);
      router.refresh();
    });
  }

  return (
    <section className="rounded-2xl border border-line bg-white shadow-sm p-5">
      <h2 className="flex items-center gap-1.5 font-semibold text-navy">
        <ClipboardList className="h-4 w-4 text-signal" strokeWidth={2.25} />
        Delivery / pickup checklist
      </h2>

      <dl className="mt-3 space-y-2 text-sm">
        <div className="flex items-start gap-2">
          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-steel" />
          <div>
            <dt className="text-xs uppercase tracking-wide text-steel">Address</dt>
            <dd className="text-navy">{eventAddress || "No address on file"}</dd>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-steel" />
          <div>
            <dt className="text-xs uppercase tracking-wide text-steel">Delivery window</dt>
            <dd className="text-navy">{deliveryWindowLabel}</dd>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-steel" />
          <div>
            <dt className="text-xs uppercase tracking-wide text-steel">Pickup window</dt>
            <dd className="text-navy">{pickupWindowLabel}</dd>
          </div>
        </div>
      </dl>

      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3 border-t border-line pt-4">
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-xs font-medium text-navy">
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" /> On-site contact
            </span>
            <input
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="Name at the venue"
              className="rounded-lg border border-line px-2.5 py-1.5 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-navy">
            <span className="flex items-center gap-1">
              <Phone className="h-3 w-3" /> Contact phone
            </span>
            <input
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="(512) 555-0100"
              className="rounded-lg border border-line px-2.5 py-1.5 text-sm"
            />
          </label>
        </div>
        <label className="flex flex-col gap-1 text-xs font-medium text-navy">
          Load-in notes
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Loading dock, gate code, parking, stairs, etc."
            className="rounded-lg border border-line px-2.5 py-1.5 text-sm"
          />
        </label>
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={pending}
            className="w-fit rounded-full bg-navy px-4 py-2 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-50"
          >
            {pending ? "Saving…" : "Save checklist"}
          </button>
          {saved && !pending && <span className="text-sm text-signal">Saved.</span>}
        </div>
      </form>
    </section>
  );
}
