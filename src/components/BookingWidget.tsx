"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { RENTAL_HOURS } from "@/lib/rental";
import RentalAgreementText from "@/components/RentalAgreementText";
import SignatureBlock from "@/components/SignatureBlock";
import {
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronLeft,
  Clock,
  CreditCard,
  Loader2,
  PartyPopper,
  Truck,
} from "lucide-react";

// Business hours for the pickup time picker — bounded so a 21h rental
// doesn't produce an absurd overnight drop-off time.
const MIN_PICKUP_TIME = "07:00";
const MAX_PICKUP_TIME = "20:00";
const DEFAULT_PICKUP_TIME = "08:00";

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

type SignatureResult = { name: string; hash: string; ip: string; signedAt: string };

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
  const [step, setStep] = useState<"form" | "review" | "done">("form");

  const fulfillmentType: "DELIVERY" | "SELF_PICKUP" = target.kind === "package" ? "DELIVERY" : "SELF_PICKUP";

  const [pickupDate, setPickupDate] = useState(todayStr());
  const [pickupTime, setPickupTime] = useState(DEFAULT_PICKUP_TIME);
  const [quantity, setQuantity] = useState(1);

  const pickupAtStr = `${pickupDate}T${pickupTime}`;
  const pickupAtDate = useMemo(() => new Date(pickupAtStr), [pickupAtStr]);
  const dropoffAtDate = useMemo(
    () => new Date(pickupAtDate.getTime() + RENTAL_HOURS * 3600_000),
    [pickupAtDate]
  );

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
  const [signatureName, setSignatureName] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [humanVerified, setHumanVerified] = useState(false);
  const [verifyingHuman, setVerifyingHuman] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<{ id: string } | null>(null);
  const [signatureResult, setSignatureResult] = useState<SignatureResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    setChecking(true);
    setError(null);

    const url =
      target.kind === "item"
        ? `/api/availability?itemId=${target.itemId}&pickupAt=${pickupAtStr}`
        : `/api/availability/package?packageId=${target.packageId}&pickupAt=${pickupAtStr}`;

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
  }, [pickupAtStr, target]);

  const canSubmit = useMemo(() => {
    if (target.kind === "item") return (itemAvailable ?? 0) >= quantity;
    return pkgBookable === true;
  }, [target, itemAvailable, quantity, pkgBookable]);

  function handleContinueToReview(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setStep("review");
  }

  function handleVerifyHuman() {
    if (humanVerified || verifyingHuman) return;
    setVerifyingHuman(true);
    setTimeout(() => {
      setVerifyingHuman(false);
      setHumanVerified(true);
    }, 1200);
  }

  async function handleSignAndSubmit() {
    if (!signatureName.trim()) {
      setError("Type your full name to sign.");
      return;
    }
    if (!agreedToTerms) {
      setError("You must agree to the rental agreement terms.");
      return;
    }
    if (!humanVerified) {
      setError("Please confirm you're not a robot.");
      return;
    }
    setSubmitting(true);
    setError(null);

    const bookingData =
      target.kind === "item"
        ? {
            kind: "item" as const,
            itemId: target.itemId,
            quantity,
            pickupAt: pickupAtStr,
            eventName,
            eventAddress,
            notes,
            customer: { name, email, phone, org },
            signatureName: signatureName.trim(),
            agreedToTerms,
            humanVerified,
          }
        : {
            kind: "package" as const,
            packageId: target.packageId,
            pickupAt: pickupAtStr,
            eventName,
            eventAddress,
            notes,
            customer: { name, email, phone, org },
            signatureName: signatureName.trim(),
            agreedToTerms,
            humanVerified,
          };

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookingData),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not submit booking request.");
        return;
      }
      setConfirmation({ id: data.id });
      if (data.signature) {
        setSignatureResult({
          name: data.signature.name,
          hash: data.signature.hash,
          ip: data.signature.ip,
          signedAt: data.signature.signedAt,
        });
      }
      setStep("done");
    } catch {
      setError("Network error — please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (step === "done" && confirmation) {
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

        {signatureResult && (
          <div className="mt-4">
            <SignatureBlock
              name={signatureResult.name}
              hash={signatureResult.hash}
              ip={signatureResult.ip}
              signedAt={format(new Date(signatureResult.signedAt), "MMM d, yyyy 'at' h:mm a")}
            />
          </div>
        )}

        <div className="mt-5 rounded-lg border border-dashed border-line bg-paper/60 p-4">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-navy">
            <CreditCard className="h-4 w-4 text-steel" /> Payment
          </p>
          <p className="mt-1 text-xs leading-relaxed text-steel">
            We&apos;ve emailed your confirmation — our team will contact you to arrange the booking
            fee.
          </p>
        </div>
      </div>
    );
  }

  if (step === "review") {
    return (
      <div className="animate-fade-up rounded-2xl border border-line bg-white p-7 shadow-sm">
        <button
          type="button"
          onClick={() => setStep("form")}
          className="flex items-center gap-1 text-xs font-semibold text-steel hover:text-navy"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Back
        </button>

        <h3 className="mt-3 font-display text-lg font-semibold text-navy">
          Review &amp; sign the rental agreement
        </h3>
        <p className="mt-1 text-sm text-steel">
          Please review the agreement below, then type your name to sign it electronically.
        </p>

        <div className="mt-4 max-h-80 overflow-y-auto rounded-lg border border-line bg-paper/40 p-4">
          <RentalAgreementText
            renterName={name}
            org={org}
            phone={phone}
            email={email}
            eventName={eventName}
            eventAddress={eventAddress}
            equipmentLines={[
              target.kind === "item" ? `${quantity}× ${target.itemName}` : target.packageName,
            ]}
            fulfillmentType={fulfillmentType}
            pickupLabel={format(pickupAtDate, "MMM d, yyyy 'at' h:mm a")}
            dropoffLabel={format(dropoffAtDate, "MMM d, yyyy 'at' h:mm a")}
          />
        </div>

        <label className="mt-5 flex items-start gap-2 text-sm text-steel">
          <input
            type="checkbox"
            checked={agreedToTerms}
            onChange={(e) => setAgreedToTerms(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-line"
          />
          I agree to the rental agreement terms above
        </label>

        <label className="mt-4 flex flex-col gap-1.5 text-sm font-semibold text-navy">
          Type your full name to sign
          <input
            value={signatureName}
            onChange={(e) => setSignatureName(e.target.value)}
            placeholder="Your full legal name"
            className={fieldClass}
          />
        </label>
        {signatureName.trim() && (
          <div className="mt-2 rounded-xl border border-line bg-paper/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-steel">Preview</p>
            <p className="font-signature text-3xl leading-tight text-navy">{signatureName}</p>
          </div>
        )}

        <button
          type="button"
          onClick={handleVerifyHuman}
          disabled={humanVerified}
          className="mt-4 flex items-center gap-2.5 rounded-lg border border-line bg-paper/50 px-3.5 py-2.5 text-sm font-medium text-navy transition hover:border-signal/40 disabled:cursor-default"
        >
          <span
            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
              humanVerified ? "border-signal bg-signal text-white" : "border-line bg-white"
            }`}
          >
            {verifyingHuman ? (
              <Loader2 className="h-3 w-3 animate-spin text-steel" />
            ) : humanVerified ? (
              <Check className="h-3 w-3" strokeWidth={3} />
            ) : null}
          </span>
          {verifyingHuman ? "Verifying…" : humanVerified ? "Verified — you're not a robot" : "I'm not a robot"}
        </button>

        {error && <p className="mt-3 text-sm font-medium text-red-600">{error}</p>}

        <button
          type="button"
          disabled={submitting || !signatureName.trim() || !agreedToTerms || !humanVerified}
          onClick={handleSignAndSubmit}
          className="mt-5 w-full rounded-full bg-amber px-5 py-3.5 font-semibold text-amber-deep shadow-sm shadow-amber/30 transition hover:brightness-95 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
        >
          {submitting ? "Submitting…" : "Sign agreement & continue"}
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleContinueToReview}
      className="flex flex-col gap-6 rounded-2xl border border-line bg-white p-7 shadow-sm"
    >
      <div>
        <h3 className="font-display text-lg font-semibold text-navy">Request this booking</h3>
        <p className="mt-1 text-sm text-steel">
          {target.kind === "item" ? target.itemName : target.packageName}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <label className={labelClass}>
          <span className="flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5 text-steel" /> Pickup date
          </span>
          <input
            type="date"
            required
            min={todayStr()}
            value={pickupDate}
            onChange={(e) => setPickupDate(e.target.value)}
            className={fieldClass}
          />
        </label>
        <label className={labelClass}>
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-steel" /> Pickup time
          </span>
          <input
            type="time"
            required
            min={MIN_PICKUP_TIME}
            max={MAX_PICKUP_TIME}
            value={pickupTime}
            onChange={(e) => setPickupTime(e.target.value)}
            className={fieldClass}
          />
        </label>
      </div>

      <div className="rounded-lg border border-line bg-paper/50 px-4 py-3 text-sm text-steel">
        Return due{" "}
        <span className="font-semibold text-navy">{format(dropoffAtDate, "EEE, MMM d 'at' h:mm a")}</span>.
        Returns after this time are billed for an additional day.
      </div>

      <div className="flex items-start gap-2 rounded-lg border border-line bg-paper/50 px-4 py-3 text-sm text-steel">
        <Truck className="mt-0.5 h-4 w-4 shrink-0 text-signal" />
        {fulfillmentType === "DELIVERY"
          ? "We'll deliver this to your event address at the pickup time above."
          : "You'll need to pick this up from our location — no delivery is included."}
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
              {itemAvailable} of {target.maxQuantity} available for that pickup time.
              {itemAvailable < quantity && " Not enough for the quantity requested."}
            </span>
          </span>
        )}
        {!checking && target.kind === "package" && pkgLines && (
          <div>
            <p className="flex items-center gap-2">
              {pkgBookable && <CheckCircle2 className="h-4 w-4 shrink-0" />}
              {pkgBookable
                ? "This package is available for that pickup time."
                : "One or more components are unavailable for that pickup time:"}
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
        disabled={!canSubmit || checking}
        className="rounded-full bg-amber px-5 py-3.5 font-semibold text-amber-deep shadow-sm shadow-amber/30 transition hover:brightness-95 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
      >
        Continue to review &amp; sign
      </button>
    </form>
  );
}
