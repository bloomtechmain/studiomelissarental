"use client";

import { useEffect, useMemo, useState } from "react";
import { SLOTS, type SlotKey } from "@/lib/slots";
import { CalendarDays, CheckCircle2, Loader2, PartyPopper, Sun, Moon } from "lucide-react";

type Target =
  | { kind: "item"; itemId: string; itemName: string; maxQuantity: number }
  | { kind: "package"; packageId: string; packageName: string };

type PackageAvailabilityLine = {
  itemId: string;
  itemName: string;
  required: number;
  available: number;
  ok: boolean;
};

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

const fieldClass =
  "rounded-lg border border-line bg-white px-3.5 py-2.5 text-navy transition focus:border-signal focus:outline-none focus:ring-2 focus:ring-signal/15";
const labelClass = "flex flex-col gap-1.5 text-sm font-semibold text-navy";

export default function BookingWidget({ target }: { target: Target }) {
  const [date, setDate] = useState(todayStr());
  const [slot, setSlot] = useState<SlotKey>("MORNING");
  const [quantity, setQuantity] = useState(1);

  const [checking, setChecking] = useState(false);
  const [itemAvailable, setItemAvailable] = useState<number | null>(null);
  const [pkgLines, setPkgLines] = useState<PackageAvailabilityLine[] | null>(null);
  const [pkgBookable, setPkgBookable] = useState<boolean | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [org, setOrg] = useState("");
  const [eventName, setEventName] = useState("");
  const [eventAddress, setEventAddress] = useState("");
  const [notes, setNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<{ id: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    setChecking(true);
    setError(null);

    const url =
      target.kind === "item"
        ? `/api/availability?itemId=${target.itemId}&date=${date}&slot=${slot}`
        : `/api/availability/package?packageId=${target.packageId}&date=${date}&slot=${slot}`;

    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (target.kind === "item") {
          setItemAvailable(data.available ?? 0);
        } else {
          setPkgLines(data.lines ?? []);
          setPkgBookable(Boolean(data.bookable));
        }
      })
      .catch(() => {
        if (!cancelled) setError("Could not check availability. Please try again.");
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });

    return () => {
      cancelled = true;
    };
  }, [date, slot, target]);

  const canSubmit = useMemo(() => {
    if (target.kind === "item") return (itemAvailable ?? 0) >= quantity;
    return pkgBookable === true;
  }, [target, itemAvailable, quantity, pkgBookable]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const body =
      target.kind === "item"
        ? {
            kind: "item" as const,
            itemId: target.itemId,
            quantity,
            date,
            slot,
            eventName,
            eventAddress,
            notes,
            customer: { name, email, phone, org },
          }
        : {
            kind: "package" as const,
            packageId: target.packageId,
            date,
            slot,
            eventName,
            eventAddress,
            notes,
            customer: { name, email, phone, org },
          };

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not submit booking request.");
        return;
      }
      setConfirmation({ id: data.id });
    } catch {
      setError("Network error — please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (confirmation) {
    return (
      <div className="animate-fade-up rounded-2xl border border-line bg-white p-7 shadow-sm">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-signal-light/50 text-signal">
          <PartyPopper className="h-5 w-5" strokeWidth={2.25} />
        </span>
        <p className="tier-pill mt-4">Request received</p>
        <h3 className="mt-3 font-display text-xl font-semibold text-navy">
          Thanks, {name.split(" ")[0] || "there"} — we&apos;ve got your booking request.
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-steel">
          Reference:{" "}
          <span className="font-mono font-semibold text-navy">
            {confirmation.id.slice(0, 8).toUpperCase()}
          </span>
          <br />
          It&apos;s pending confirmation — our team will reach out shortly to confirm details and
          collect the booking fee.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-6 rounded-2xl border border-line bg-white p-7 shadow-sm"
    >
      <div>
        <h3 className="font-display text-lg font-semibold text-navy">Request this booking</h3>
        <p className="mt-1 text-sm text-steel">
          {target.kind === "item" ? target.itemName : target.packageName}
        </p>
      </div>

      <label className={labelClass}>
        <span className="flex items-center gap-1.5">
          <CalendarDays className="h-3.5 w-3.5 text-steel" /> Date
        </span>
        <input
          type="date"
          required
          min={todayStr()}
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className={fieldClass}
        />
      </label>

      <div>
        <p className="text-sm font-semibold text-navy">Time slot</p>
        <div className="mt-1.5 grid grid-cols-2 gap-2">
          {(Object.keys(SLOTS) as SlotKey[]).map((key) => {
            const active = slot === key;
            const Icon = key === "MORNING" ? Sun : Moon;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSlot(key)}
                className={`flex flex-col items-center gap-1 rounded-lg border px-3 py-3 text-center transition ${
                  active
                    ? "border-signal bg-signal-light/40 text-navy shadow-sm"
                    : "border-line text-steel hover:border-signal/50"
                }`}
              >
                <Icon className={`h-4 w-4 ${active ? "text-signal" : "text-steel/60"}`} />
                <span className="text-xs font-semibold">{SLOTS[key].label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {target.kind === "item" && (
        <label className={labelClass}>
          Quantity
          <input
            type="number"
            min={1}
            max={target.maxQuantity}
            required
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className={`${fieldClass} w-24`}
          />
        </label>
      )}

      <div
        className={`rounded-lg border px-4 py-3 text-sm transition-colors ${
          checking
            ? "border-line bg-paper text-steel"
            : target.kind === "item"
              ? itemAvailable !== null && itemAvailable >= quantity
                ? "border-signal/30 bg-signal-light/30 text-navy"
                : "border-amber/40 bg-amber/10 text-amber-deep"
              : pkgBookable
                ? "border-signal/30 bg-signal-light/30 text-navy"
                : "border-amber/40 bg-amber/10 text-amber-deep"
        }`}
      >
        {checking && (
          <span className="flex items-center gap-2">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Checking availability…
          </span>
        )}
        {!checking && target.kind === "item" && itemAvailable !== null && (
          <span className="flex items-center gap-2">
            {itemAvailable >= quantity && <CheckCircle2 className="h-4 w-4 shrink-0" />}
            <span>
              {itemAvailable} of {target.maxQuantity} available for that date/slot.
              {itemAvailable < quantity && " Not enough for the quantity requested."}
            </span>
          </span>
        )}
        {!checking && target.kind === "package" && pkgLines && (
          <div>
            <p className="flex items-center gap-2">
              {pkgBookable && <CheckCircle2 className="h-4 w-4 shrink-0" />}
              {pkgBookable
                ? "This package is available for that date/slot."
                : "One or more components are unavailable for that date/slot:"}
            </p>
            {!pkgBookable && (
              <ul className="mt-1.5 list-disc space-y-0.5 pl-5">
                {pkgLines
                  .filter((l) => !l.ok)
                  .map((l) => (
                    <li key={l.itemId}>
                      {l.itemName}: need {l.required}, only {l.available} free
                    </li>
                  ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <label className={labelClass}>
          Name
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={fieldClass}
          />
        </label>
        <label className={labelClass}>
          Phone
          <input
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={fieldClass}
          />
        </label>
        <label className={labelClass}>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={fieldClass}
          />
        </label>
        <label className={labelClass}>
          Organization
          <input value={org} onChange={(e) => setOrg(e.target.value)} className={fieldClass} />
        </label>
        <label className={`${labelClass} col-span-2`}>
          Event name
          <input
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            className={fieldClass}
          />
        </label>
        <label className={`${labelClass} col-span-2`}>
          Event address
          <input
            value={eventAddress}
            onChange={(e) => setEventAddress(e.target.value)}
            className={fieldClass}
          />
        </label>
        <label className={`${labelClass} col-span-2`}>
          Notes
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className={fieldClass}
          />
        </label>
      </div>

      {error && <p className="text-sm font-medium text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={!canSubmit || submitting || checking}
        className="rounded-full bg-amber px-5 py-3.5 font-semibold text-amber-deep shadow-sm shadow-amber/30 transition hover:brightness-95 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
      >
        {submitting ? "Submitting…" : "Request booking"}
      </button>
    </form>
  );
}
