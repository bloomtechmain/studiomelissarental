"use client";

import { useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  PartyPopper,
  Upload,
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

const SIGNATURE_WIDTH = 772;
const SIGNATURE_HEIGHT = 229;
const SIGNATURE_MAX_BYTES = 500 * 1024;

function readImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read that image file."));
    };
    img.src = url;
  });
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
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  const [signatureFileError, setSignatureFileError] = useState<string | null>(null);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [signatureResult, setSignatureResult] = useState<{
    name: string;
    code: string;
    ip: string;
    signedAt: string;
    imageDataUrl: string;
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
    if (!signatureName.trim()) setSignatureName(name.trim());
    setStep(3);
  }

  async function handleSignatureFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    setSignatureFileError(null);
    setSignatureFile(null);
    setSignaturePreview(null);
    if (!file) return;

    if (file.type !== "image/png") {
      setSignatureFileError("Signature must be a PNG file.");
      return;
    }
    if (file.size > SIGNATURE_MAX_BYTES) {
      setSignatureFileError("Signature file is too large (500KB max).");
      return;
    }
    try {
      const { width, height } = await readImageDimensions(file);
      if (width !== SIGNATURE_WIDTH || height !== SIGNATURE_HEIGHT) {
        setSignatureFileError(
          `Signature image must be exactly ${SIGNATURE_WIDTH}×${SIGNATURE_HEIGHT}px (this one is ${width}×${height}).`
        );
        return;
      }
    } catch {
      setSignatureFileError("Could not read that image file.");
      return;
    }

    setSignatureFile(file);
    setSignaturePreview(URL.createObjectURL(file));
  }

  async function handleSignAndSubmit() {
    setError(null);
    if (!signatureName.trim()) {
      setError("Type your printed name to sign.");
      return;
    }
    if (!signatureFile) {
      setError("Upload your signature image to sign.");
      return;
    }

    setSubmitting(true);
    try {
      const imageDataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("Could not read signature image."));
        reader.readAsDataURL(signatureFile);
      });

      const formData = new FormData();
      formData.set(
        "data",
        JSON.stringify({
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
          website,
        })
      );
      formData.set("signature", signatureFile, "signature.png");

      const res = await fetch("/api/leads", { method: "POST", body: formData });
      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData?.error || "Something went wrong. Please try again.");
      }
      if (resData.signature) {
        setSignatureResult({
          name: resData.signature.name,
          code: resData.signature.code,
          ip: resData.signature.ip,
          signedAt: resData.signature.signedAt,
          imageDataUrl,
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

        {signatureResult && (
          <div className="mt-5">
            <SignatureBlock
              name={signatureResult.name}
              hash={signatureResult.code}
              ip={signatureResult.ip}
              signedAt={format(new Date(signatureResult.signedAt), "MMM d, yyyy 'at' h:mm a")}
            />
            <img
              src={signatureResult.imageDataUrl}
              alt="Your signature"
              className="mt-3 w-full rounded-lg border border-line bg-white"
            />
          </div>
        )}
      </div>
    );
  }

  if (step === 1) {
    return (
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
    );
  }

  if (step === 2) {
    return (
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
            Event name / venue
            <input
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              className={fieldClass}
              placeholder="e.g. Smith wedding reception"
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
    );
  }

  return (
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

      <p className="mt-5 text-sm font-semibold text-navy">Upload your signature</p>
      <p className="mt-0.5 text-xs text-steel">
        PNG only, exactly {SIGNATURE_WIDTH}×{SIGNATURE_HEIGHT}px, under 500KB.
      </p>

      {signaturePreview ? (
        <div className="mt-1.5">
          <img
            src={signaturePreview}
            alt="Your uploaded signature"
            className="w-full rounded-lg border border-line bg-white"
          />
          <label className="mt-1.5 inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-navy hover:text-signal">
            <Upload className="h-3 w-3" />
            Replace file
            <input type="file" accept="image/png" onChange={handleSignatureFileChange} className="hidden" />
          </label>
        </div>
      ) : (
        <label className="mt-1.5 flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-line bg-paper/40 px-4 py-8 text-center text-sm text-steel transition hover:border-signal/50">
          <Upload className="h-5 w-5 text-steel/60" />
          Click to upload your signature (PNG)
          <input type="file" accept="image/png" onChange={handleSignatureFileChange} className="hidden" />
        </label>
      )}
      {signatureFileError && (
        <p className="mt-1.5 text-xs font-medium text-red-600">{signatureFileError}</p>
      )}

      <label className="mt-3 flex flex-col gap-1.5 text-sm font-semibold text-navy">
        Printed name
        <input
          value={signatureName}
          onChange={(e) => setSignatureName(e.target.value)}
          placeholder="Your full legal name"
          className={fieldClass}
        />
      </label>

      {error && <p className="mt-3 text-sm font-medium text-red-600">{error}</p>}

      <button
        type="button"
        disabled={submitting}
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
  );
}
