"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createQuote } from "../actions";
import type { SlotKey } from "@/lib/slots";
import { SLOTS } from "@/lib/slots";

type Option = { id: string; label: string };

export default function NewQuoteForm({
  leads,
  customers,
  packages,
  defaultLeadId,
}: {
  leads: Option[];
  customers: Option[];
  packages: (Option & { price: number })[];
  defaultLeadId?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [leadId, setLeadId] = useState(defaultLeadId ?? "");
  const [customerId, setCustomerId] = useState("");
  const [packageId, setPackageId] = useState("");
  const [eventName, setEventName] = useState("");
  const [eventAddress, setEventAddress] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [slot, setSlot] = useState<SlotKey>("MORNING");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const id = await createQuote({
        leadId: leadId || undefined,
        customerId: customerId || undefined,
        packageId: packageId || undefined,
        eventName,
        eventAddress,
        eventDate,
        slot,
      });
      router.push(`/admin/quotes/${id}`);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 flex max-w-xl flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1 text-sm font-medium text-navy">
          Lead (optional)
          <select value={leadId} onChange={(e) => setLeadId(e.target.value)} className="rounded border border-line px-3 py-2">
            <option value="">— none —</option>
            {leads.map((l) => (
              <option key={l.id} value={l.id}>
                {l.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-navy">
          Customer (optional)
          <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} className="rounded border border-line px-3 py-2">
            <option value="">— none —</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <label className="col-span-2 flex flex-col gap-1 text-sm font-medium text-navy">
          Package tier
          <select value={packageId} onChange={(e) => setPackageId(e.target.value)} className="rounded border border-line px-3 py-2">
            <option value="">Custom build — add line items manually</option>
            {packages.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label} — ${p.price.toFixed(0)}
              </option>
            ))}
          </select>
        </label>
        <label className="col-span-2 flex flex-col gap-1 text-sm font-medium text-navy">
          Event name
          <input value={eventName} onChange={(e) => setEventName(e.target.value)} className="rounded border border-line px-3 py-2" />
        </label>
        <label className="col-span-2 flex flex-col gap-1 text-sm font-medium text-navy">
          Event address
          <input value={eventAddress} onChange={(e) => setEventAddress(e.target.value)} className="rounded border border-line px-3 py-2" />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-navy">
          Event date
          <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className="rounded border border-line px-3 py-2" />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-navy">
          Time slot
          <select value={slot} onChange={(e) => setSlot(e.target.value as SlotKey)} className="rounded border border-line px-3 py-2">
            {(Object.keys(SLOTS) as SlotKey[]).map((k) => (
              <option key={k} value={k}>
                {SLOTS[k].label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-full bg-navy px-5 py-2.5 font-semibold text-white hover:brightness-110 disabled:opacity-50"
      >
        {pending ? "Creating…" : "Create quote"}
      </button>
    </form>
  );
}
