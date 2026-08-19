"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, PartyPopper } from "lucide-react";

const fieldClass =
  "rounded-lg border border-line bg-white px-3.5 py-2.5 text-navy transition focus:border-signal focus:outline-none focus:ring-2 focus:ring-signal/15";
const labelClass = "flex flex-col gap-1.5 text-sm font-semibold text-navy";

export default function QuoteRequestForm({
  tierOptions,
  defaultTier,
}: {
  tierOptions: string[];
  defaultTier?: string;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [org, setOrg] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [roomSize, setRoomSize] = useState("");
  const [guestCount, setGuestCount] = useState("");
  const [recommendedTier, setRecommendedTier] = useState(defaultTier ?? "");
  const [eventAddress, setEventAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [website, setWebsite] = useState(""); // honeypot

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email.trim() && !phone.trim()) {
      setError("Give us an email or a phone number so we can get back to you.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          org,
          eventDate,
          roomSize,
          guestCount: guestCount ? Number(guestCount) : undefined,
          recommendedTier,
          eventAddress,
          notes,
          website,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || "Something went wrong. Please try again.");
      }
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="animate-fade-up rounded-2xl border border-line bg-white p-8 text-center shadow-sm">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-signal-light/50 text-signal">
          <PartyPopper className="h-6 w-6" strokeWidth={2.25} />
        </span>
        <h3 className="mt-4 font-display text-xl font-semibold text-navy">Request sent</h3>
        <p className="mt-2 text-sm leading-relaxed text-steel">
          Thanks{name ? `, ${name.split(" ")[0]}` : ""} — we&apos;ve got your details and someone
          from our team will follow up shortly with a quote.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="animate-fade-up rounded-2xl border border-line bg-white p-7 shadow-sm"
    >
      {/* Honeypot — hidden from real visitors */}
      <div className="hidden" aria-hidden="true">
        <label>
          Leave this field empty
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className={labelClass}>
          Full name *
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={fieldClass}
            placeholder="Jane Doe"
          />
        </label>
        <label className={labelClass}>
          Organization
          <input
            value={org}
            onChange={(e) => setOrg(e.target.value)}
            className={fieldClass}
            placeholder="Optional"
          />
        </label>
        <label className={labelClass}>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={fieldClass}
            placeholder="jane@email.com"
          />
        </label>
        <label className={labelClass}>
          Phone
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={fieldClass}
            placeholder="(512) 555-0100"
          />
        </label>
        <label className={labelClass}>
          Event date
          <input
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            className={fieldClass}
          />
        </label>
        <label className={labelClass}>
          Guest count
          <input
            type="number"
            min={0}
            value={guestCount}
            onChange={(e) => setGuestCount(e.target.value)}
            className={fieldClass}
            placeholder="e.g. 150"
          />
        </label>
        <label className={labelClass}>
          Room / venue size
          <input
            value={roomSize}
            onChange={(e) => setRoomSize(e.target.value)}
            className={fieldClass}
            placeholder="e.g. large hall, outdoor tent"
          />
        </label>
        <label className={labelClass}>
          Which tier fits best?
          <select
            value={recommendedTier}
            onChange={(e) => setRecommendedTier(e.target.value)}
            className={fieldClass}
          >
            <option value="">Not sure — help me choose</option>
            {tierOptions.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label className={`${labelClass} sm:col-span-2`}>
          Event address
          <input
            value={eventAddress}
            onChange={(e) => setEventAddress(e.target.value)}
            className={fieldClass}
            placeholder="Venue address or city"
          />
        </label>
        <label className={`${labelClass} sm:col-span-2`}>
          Tell us about your event
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className={`${fieldClass} min-h-24 resize-y`}
            placeholder="What kind of event, any special requirements, timing, etc."
          />
        </label>
      </div>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-600">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-amber px-6 py-3 font-semibold text-amber-deep shadow-sm shadow-amber/30 transition hover:brightness-95 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Sending…
          </>
        ) : (
          <>
            <CheckCircle2 className="h-4 w-4" /> Request my quote
          </>
        )}
      </button>
    </form>
  );
}
