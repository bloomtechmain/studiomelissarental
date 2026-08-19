"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createLead } from "../actions";
import type { LeadSource } from "@prisma/client";

const SOURCES: LeadSource[] = ["PHONE", "EMAIL", "WEBSITE", "REFERRAL", "REPEAT_CUSTOMER"];

export default function NewLeadForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [org, setOrg] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [roomSize, setRoomSize] = useState("");
  const [guestCount, setGuestCount] = useState("");
  const [recommendedTier, setRecommendedTier] = useState("");
  const [eventAddress, setEventAddress] = useState("");
  const [source, setSource] = useState<LeadSource>("PHONE");
  const [notes, setNotes] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const id = await createLead({
        name,
        email,
        phone,
        org,
        eventDate,
        roomSize,
        guestCount: guestCount ? Number(guestCount) : undefined,
        recommendedTier,
        eventAddress,
        source,
        notes,
      });
      router.push(`/admin/leads/${id}`);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 flex max-w-xl flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1 text-sm font-medium text-navy">
          Name
          <input required value={name} onChange={(e) => setName(e.target.value)} className="rounded border border-line px-3 py-2" />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-navy">
          Organization
          <input value={org} onChange={(e) => setOrg(e.target.value)} className="rounded border border-line px-3 py-2" />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-navy">
          Phone
          <input value={phone} onChange={(e) => setPhone(e.target.value)} className="rounded border border-line px-3 py-2" />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-navy">
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="rounded border border-line px-3 py-2" />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-navy">
          Source
          <select value={source} onChange={(e) => setSource(e.target.value as LeadSource)} className="rounded border border-line px-3 py-2">
            {SOURCES.map((s) => (
              <option key={s} value={s}>
                {s.replace("_", " ")}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-navy">
          Event date
          <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className="rounded border border-line px-3 py-2" />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-navy">
          Room size
          <input value={roomSize} onChange={(e) => setRoomSize(e.target.value)} placeholder="e.g. 40x60 ft" className="rounded border border-line px-3 py-2" />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-navy">
          Guest count
          <input type="number" min={0} value={guestCount} onChange={(e) => setGuestCount(e.target.value)} className="rounded border border-line px-3 py-2" />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-navy">
          Recommended tier
          <input value={recommendedTier} onChange={(e) => setRecommendedTier(e.target.value)} placeholder="Huddle / Gathering / Hall / Field" className="rounded border border-line px-3 py-2" />
        </label>
        <label className="col-span-2 flex flex-col gap-1 text-sm font-medium text-navy">
          Event address / venue
          <input value={eventAddress} onChange={(e) => setEventAddress(e.target.value)} className="rounded border border-line px-3 py-2" />
        </label>
        <label className="col-span-2 flex flex-col gap-1 text-sm font-medium text-navy">
          Notes
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="rounded border border-line px-3 py-2" />
        </label>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-full bg-navy px-5 py-2.5 font-semibold text-white hover:brightness-110 disabled:opacity-50"
      >
        {pending ? "Creating…" : "Create lead"}
      </button>
    </form>
  );
}
