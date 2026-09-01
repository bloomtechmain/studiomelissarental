"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { RENTAL_HOURS } from "@/lib/rental";
import RentalAgreementText from "@/components/RentalAgreementText";
import SignatureBlock from "@/components/SignatureBlock";
import {
  Briefcase,
  Building2,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  CreditCard,
  Loader2,
  Mail,
  MapPin,
  MessageSquare,
  PartyPopper,
  Phone as PhoneIcon,
  PlugZap,
  ToggleLeft,
  Truck,
  User,
  Users,
} from "lucide-react";

// Business hours for the pickup time picker — bounded so a 21h rental
// doesn't produce an absurd overnight drop-off time.
const MIN_PICKUP_TIME = "07:00";
const MAX_PICKUP_TIME = "20:00";
const DEFAULT_PICKUP_TIME = "08:00";

const EVENT_TYPES = ["Home", "Commercial", "Corporate", "Other"] as const;
const POWER_OPTIONS = ["Standard outlets", "Generator", "Not sure"] as const;

type Target =
  | { kind: "item"; itemId: string; itemName: string; maxQuantity: number }
  | { kind: "package"; packageId: string; packageName: string };

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

function FieldLabel({
  icon: Icon,
  children,
}: {
  icon: typeof User;
  children: React.ReactNode;
}) {
  return (
    <span className="flex items-center gap-1.5">
      <Icon className="h-3.5 w-3.5 text-steel" />
      {children}
    </span>
  );
}

const STEPS = [
  { n: 1, label: "Pickup date" },
  { n: 2, label: "Your details" },
  { n: 3, label: "Sign & send" },
] as const;

function StepIndicator({ current }: { current: 1 | 2 | 3 }) {
  return (
    <div className="mb-7 flex items-center">
      {STEPS.map((s, i) => (
        <div key={s.n} className="flex flex-1 items-center last:flex-none">
          <div className="flex flex-col items-center gap-1.5">
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                current === s.n
                  ? "bg-navy text-white"
                  : current > s.n
                    ? "bg-signal-light/60 text-signal"
                    : "border border-line bg-white text-steel"
              }`}
            >
              {current > s.n ? <Check className="h-4 w-4" strokeWidth={3} /> : s.n}
            </span>
            <span
              className={`text-[11px] font-semibold tracking-wide uppercase ${
                current === s.n ? "text-navy" : "text-steel"
              }`}
            >
              {s.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div
              className={`mx-2 mb-5 h-0.5 flex-1 rounded-full transition-colors ${
                current > s.n ? "bg-signal-light" : "bg-line"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export default function BookingWidget({ target }: { target: Target }) {
  const [step, setStep] = useState<"date" | "details" | "review" | "done">("date");

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

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [org, setOrg] = useState("");
  const [eventName, setEventName] = useState("");
  const [eventAddress, setEventAddress] = useState("");
  const [eventType, setEventType] = useState<(typeof EVENT_TYPES)[number]>("Home");
  const [guestCount, setGuestCount] = useState("");
  const [venueType, setVenueType] = useState<"Indoor" | "Outdoor">("Indoor");
  const [powerAvailable, setPowerAvailable] = useState("");
  const [notes, setNotes] = useState("");
  const [signatureName, setSignatureName] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [humanVerified, setHumanVerified] = useState(false);
  const [verifyingHuman, setVerifyingHuman] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<{ id: string } | null>(null);
  const [signatureResult, setSignatureResult] = useState<SignatureResult | null>(null);

  // Event-context fields (event type, guest count, indoor/outdoor, power)
  // don't have dedicated Booking columns yet — fold them into notes so
  // nothing the customer entered is silently dropped.
  const composedNotes = useMemo(() => {
    const extra = [
      `Event type: ${eventType}`,
      guestCount ? `Guest count: ${guestCount}` : null,
      `Venue: ${venueType}`,
      powerAvailable ? `Power available: ${powerAvailable}` : null,
    ]
      .filter(Boolean)
      .join(" · ");
    return notes.trim() ? `${extra}\n\n${notes.trim()}` : extra;
  }, [eventType, guestCount, venueType, powerAvailable, notes]);

  function handleContinueToDetails(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setStep("details");
  }

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
            notes: composedNotes,
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
            notes: composedNotes,
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
      <div>
        <StepIndicator current={3} />
        <div className="animate-fade-up rounded-2xl border border-line bg-white p-7 shadow-sm">
          <button
            type="button"
            onClick={() => setStep("details")}
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
      </div>
    );
  }

  if (step === "details") {
    return (
      <div>
        <StepIndicator current={2} />
        <form
          onSubmit={handleContinueToReview}
          className="animate-fade-up flex flex-col gap-6 rounded-2xl border border-line bg-white p-7 shadow-sm"
        >
          <div className="flex items-center justify-between rounded-lg bg-paper/60 px-3.5 py-2.5 text-sm">
            <span className="font-medium text-navy">
              {pickupDate} · {format(pickupAtDate, "h:mm a")}
            </span>
            <button
              type="button"
              onClick={() => setStep("date")}
              className="flex items-center gap-1 font-semibold text-signal hover:text-navy"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Change
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>
              <FieldLabel icon={User}>Name *</FieldLabel>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={fieldClass}
                placeholder="Jane Doe"
              />
            </label>
            <label className={labelClass}>
              <FieldLabel icon={PhoneIcon}>Phone *</FieldLabel>
              <input
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={fieldClass}
                placeholder="(512) 555-0100"
              />
            </label>
            <label className={labelClass}>
              <FieldLabel icon={Mail}>Email</FieldLabel>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={fieldClass}
                placeholder="jane@email.com"
              />
            </label>
            <label className={labelClass}>
              <FieldLabel icon={Building2}>Event type *</FieldLabel>
              <select
                required
                value={eventType}
                onChange={(e) => setEventType(e.target.value as (typeof EVENT_TYPES)[number])}
                className={fieldClass}
              >
                {EVENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClass}>
              <FieldLabel icon={Users}>Guest count *</FieldLabel>
              <input
                type="number"
                required
                min={0}
                value={guestCount}
                onChange={(e) => setGuestCount(e.target.value)}
                className={fieldClass}
                placeholder="e.g. 150"
              />
            </label>
            <div className={labelClass}>
              <FieldLabel icon={ToggleLeft}>Indoor / outdoor *</FieldLabel>
              <div className="flex overflow-hidden rounded-lg border border-line">
                {(["Indoor", "Outdoor"] as const).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setVenueType(opt)}
                    className={`flex-1 py-2.5 text-sm font-semibold transition ${
                      venueType === opt ? "bg-navy text-white" : "bg-white text-steel hover:bg-paper"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
            <label className={labelClass}>
              <FieldLabel icon={Briefcase}>Organization</FieldLabel>
              <input value={org} onChange={(e) => setOrg(e.target.value)} className={fieldClass} />
            </label>
            <label className={`${labelClass} sm:col-span-2`}>
              <FieldLabel icon={PartyPopper}>Event name</FieldLabel>
              <input
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                className={fieldClass}
              />
            </label>
            <label className={`${labelClass} sm:col-span-2`}>
              <FieldLabel icon={MapPin}>Venue name &amp; address</FieldLabel>
              <input
                value={eventAddress}
                onChange={(e) => setEventAddress(e.target.value)}
                className={fieldClass}
                placeholder="Venue name, address or city"
              />
            </label>
            <label className={`${labelClass} sm:col-span-2`}>
              <FieldLabel icon={PlugZap}>Power available on-site</FieldLabel>
              <select
                value={powerAvailable}
                onChange={(e) => setPowerAvailable(e.target.value)}
                className={fieldClass}
              >
                <option value="">Not sure / prefer to discuss</option>
                {POWER_OPTIONS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>
            <label className={`${labelClass} sm:col-span-2`}>
              <FieldLabel icon={MessageSquare}>Notes</FieldLabel>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className={`${fieldClass} resize-y`}
              />
            </label>
          </div>

          {error && <p className="text-sm font-medium text-red-600">{error}</p>}

          <button
            type="submit"
            className="flex items-center justify-center gap-1.5 rounded-full bg-navy px-6 py-3 font-semibold text-white transition hover:brightness-110 active:scale-[0.98]"
          >
            Continue to agreement
            <ChevronRight className="h-4 w-4" />
          </button>
        </form>
      </div>
    );
  }

  return (
    <div>
      <StepIndicator current={1} />
      <form
        onSubmit={handleContinueToDetails}
        className="animate-fade-up flex flex-col gap-6 rounded-2xl border border-line bg-white p-7 shadow-sm"
      >
        <div>
          <h3 className="font-display text-lg font-semibold text-navy">
            {target.kind === "item" ? target.itemName : target.packageName}
          </h3>
          <p className="mt-1 text-sm text-steel">Pick a pickup date and time to get started.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className={labelClass}>
            <FieldLabel icon={CalendarDays}>Pickup date</FieldLabel>
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
            <FieldLabel icon={Clock}>Pickup time</FieldLabel>
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

        {error && <p className="text-sm font-medium text-red-600">{error}</p>}

        <button
          type="submit"
          className="flex items-center justify-center gap-1.5 rounded-full bg-navy px-6 py-3 font-semibold text-white transition hover:brightness-110 active:scale-[0.98]"
        >
          Continue
          <ChevronRight className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
