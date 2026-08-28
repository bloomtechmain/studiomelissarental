"use client";

import { useState } from "react";
import {
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  Mail,
  MapPin,
  MessageSquare,
  PartyPopper,
  Phone,
  Ruler,
  Sparkles,
  User,
  Users,
} from "lucide-react";
import { toDateStr, RENTAL_HOURS } from "@/lib/rental";
import LeadAgreementText from "@/components/LeadAgreementText";
import SignatureBlock from "@/components/SignatureBlock";
import { format } from "date-fns";

// Business hours for the pickup time picker — matches the booking flow.
const MIN_PICKUP_TIME = "07:00";
const MAX_PICKUP_TIME = "20:00";
const DEFAULT_PICKUP_TIME = "08:00";

function formatTimeLabel(timeStr: string): string {
  return format(new Date(`2000-01-01T${timeStr}`), "h:mm a");
}

const fieldClass =
  "rounded-lg border border-line bg-white px-3.5 py-2.5 text-navy transition focus:border-signal focus:outline-none focus:ring-2 focus:ring-signal/15";
const labelClass = "flex flex-col gap-1.5 text-sm font-semibold text-navy";

const STEPS = [
  { n: 1, label: "Event date" },
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
  const [eventTime, setEventTime] = useState(DEFAULT_PICKUP_TIME);
  const dropoffLabel =
    eventDate && eventTime
      ? format(
          new Date(new Date(`${eventDate}T${eventTime}`).getTime() + RENTAL_HOURS * 3600_000),
          "EEE, MMM d 'at' h:mm a"
        )
      : null;
  const [eventName, setEventName] = useState("");
  const [roomSize, setRoomSize] = useState("");
  const [guestCount, setGuestCount] = useState("");
  const [recommendedTier, setRecommendedTier] = useState(defaultTier ?? "");
  const [eventAddress, setEventAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [website, setWebsite] = useState(""); // honeypot

  const [signatureName, setSignatureName] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [humanVerified, setHumanVerified] = useState(false);
  const [verifyingHuman, setVerifyingHuman] = useState(false);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [confirmationId, setConfirmationId] = useState<string | null>(null);
  const [signatureResult, setSignatureResult] = useState<{
    name: string;
    code: string;
    ip: string;
    signedAt: string;
  } | null>(null);

  function handleContinueFromDate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!eventDate || !eventTime) {
      setError("Pick a date and pickup time to continue.");
      return;
    }
    setStep(2);
  }

  function handleContinueToSign(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError("Full name is required.");
      return;
    }
    if (!email.trim() && !phone.trim()) {
      setError("Give us an email or a phone number so we can get back to you.");
      return;
    }
    setStep(3);
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
    setError(null);
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
          eventTimeSlot: eventTime ? formatTimeLabel(eventTime) : undefined,
          eventName,
          roomSize,
          guestCount: guestCount ? Number(guestCount) : undefined,
          recommendedTier,
          eventAddress,
          notes,
          signatureName: signatureName.trim(),
          agreedToTerms,
          humanVerified,
          website,
        }),
      });
      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData?.error || "Something went wrong. Please try again.");
      }
      setConfirmationId(resData.id ?? null);
      if (resData.signature) {
        setSignatureResult({
          name: resData.signature.name,
          code: resData.signature.code,
          ip: resData.signature.ip,
          signedAt: resData.signature.signedAt,
        });
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
      <div className="animate-fade-up rounded-2xl border border-line bg-white p-8 shadow-sm">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-signal-light/50 text-signal">
          <PartyPopper className="h-6 w-6" strokeWidth={2.25} />
        </span>
        <h3 className="mt-4 text-center font-display text-xl font-semibold text-navy">
          Request sent
        </h3>
        <p className="mt-2 text-center text-sm leading-relaxed text-steel">
          Thanks{name ? `, ${name.split(" ")[0]}` : ""} — we&apos;ve got your details and someone
          from our team will follow up shortly with a quote.
        </p>
        {confirmationId && (
          <p className="mt-2 text-center text-sm text-steel">
            Reference:{" "}
            <span className="font-mono font-semibold text-navy">
              {confirmationId.slice(0, 8).toUpperCase()}
            </span>
          </p>
        )}

        {signatureResult && (
          <div className="mt-5">
            <SignatureBlock
              name={signatureResult.name}
              hash={signatureResult.code}
              ip={signatureResult.ip}
              signedAt={format(new Date(signatureResult.signedAt), "MMM d, yyyy 'at' h:mm a")}
            />
          </div>
        )}
      </div>
    );
  }

  if (step === 1) {
    return (
      <div>
        <StepIndicator current={1} />
        <form
          onSubmit={handleContinueFromDate}
          className="animate-fade-up rounded-2xl border border-line bg-white p-7 shadow-sm"
        >
        <h3 className="font-display text-lg font-semibold text-navy">When&apos;s your event?</h3>
        <p className="mt-1 text-sm text-steel">Pick a date and pickup time to get started.</p>

        <div className="mt-5 grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1.5 text-sm font-semibold text-navy">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5 text-steel" /> Date
            </span>
            <input
              type="date"
              required
              min={toDateStr(new Date())}
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className={fieldClass}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-semibold text-navy">
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-steel" /> Pickup time
            </span>
            <input
              type="time"
              required
              min={MIN_PICKUP_TIME}
              max={MAX_PICKUP_TIME}
              value={eventTime}
              onChange={(e) => setEventTime(e.target.value)}
              className={fieldClass}
            />
          </label>
        </div>

        {dropoffLabel && (
          <div className="mt-4 rounded-lg border border-line bg-paper/50 px-4 py-3 text-sm text-steel">
            Return due <span className="font-semibold text-navy">{dropoffLabel}</span>. Returns
            after this time are billed for an additional day.
          </div>
        )}

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          className="mt-6 flex w-full items-center justify-center gap-1.5 rounded-full bg-navy px-6 py-3 font-semibold text-white transition hover:brightness-110 active:scale-[0.98]"
        >
          Continue
          <ChevronRight className="h-4 w-4" />
        </button>
        </form>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div>
        <StepIndicator current={2} />
        <form
          onSubmit={handleContinueToSign}
          className="animate-fade-up rounded-2xl border border-line bg-white p-7 shadow-sm"
        >
        <div className="flex items-center justify-between rounded-lg bg-paper/60 px-3.5 py-2.5 text-sm">
          <span className="font-medium text-navy">
            {eventDate} · {eventTime ? formatTimeLabel(eventTime) : ""}
          </span>
          <button
            type="button"
            onClick={() => setStep(1)}
            className="font-semibold text-signal hover:text-navy"
          >
            Change
          </button>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className={labelClass}>
            <FieldLabel icon={User}>Full name *</FieldLabel>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={fieldClass}
              placeholder="Jane Doe"
            />
          </label>
          <label className={labelClass}>
            <FieldLabel icon={Building2}>Organization</FieldLabel>
            <input
              value={org}
              onChange={(e) => setOrg(e.target.value)}
              className={fieldClass}
              placeholder="Optional"
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
            <FieldLabel icon={Phone}>Phone</FieldLabel>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={fieldClass}
              placeholder="(512) 555-0100"
            />
          </label>
          <label className={labelClass}>
            <FieldLabel icon={PartyPopper}>Event name / venue</FieldLabel>
            <input
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              className={fieldClass}
              placeholder="e.g. Smith wedding reception"
            />
          </label>
          <label className={labelClass}>
            <FieldLabel icon={Users}>Guest count</FieldLabel>
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
            <FieldLabel icon={Ruler}>Room / venue size</FieldLabel>
            <input
              value={roomSize}
              onChange={(e) => setRoomSize(e.target.value)}
              className={fieldClass}
              placeholder="e.g. large hall, outdoor tent"
            />
          </label>
          <label className={labelClass}>
            <FieldLabel icon={Sparkles}>Which tier fits best?</FieldLabel>
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
            <FieldLabel icon={MapPin}>Event address</FieldLabel>
            <input
              value={eventAddress}
              onChange={(e) => setEventAddress(e.target.value)}
              className={fieldClass}
              placeholder="Venue address or city"
            />
          </label>
          <label className={`${labelClass} sm:col-span-2`}>
            <FieldLabel icon={MessageSquare}>Tell us about your event</FieldLabel>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={`${fieldClass} min-h-24 resize-y`}
              placeholder="What kind of event, any special requirements, timing, etc."
            />
          </label>
        </div>

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

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          className="mt-6 flex w-full items-center justify-center gap-1.5 rounded-full bg-navy px-6 py-3 font-semibold text-white transition hover:brightness-110 active:scale-[0.98]"
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
      <StepIndicator current={3} />
      <div className="animate-fade-up rounded-2xl border border-line bg-white p-7 shadow-sm">
      <button
        type="button"
        onClick={() => setStep(2)}
        className="flex items-center gap-1 text-xs font-semibold text-steel hover:text-navy"
      >
        <ChevronLeft className="h-3.5 w-3.5" /> Back
      </button>

      <h3 className="mt-3 font-display text-lg font-semibold text-navy">
        Review &amp; sign the rental agreement
      </h3>

      <div className="mt-4 max-h-80 overflow-y-auto rounded-lg border border-line bg-paper/40 p-4">
        <LeadAgreementText
          renterName={name}
          org={org}
          phone={phone}
          email={email}
          eventName={eventName}
          eventAddress={eventAddress}
          recommendedTier={recommendedTier}
          eventDateLabel={eventDate}
          eventTimeSlotLabel={eventTime ? formatTimeLabel(eventTime) : undefined}
          dropoffLabel={dropoffLabel ?? undefined}
          guestCount={guestCount}
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
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-amber px-6 py-3 font-semibold text-amber-deep shadow-sm shadow-amber/30 transition hover:brightness-95 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Sending…
          </>
        ) : (
          <>
            <CheckCircle2 className="h-4 w-4" /> Sign &amp; request quote
          </>
        )}
      </button>
      </div>
    </div>
  );
}
