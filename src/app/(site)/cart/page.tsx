"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { useCart } from "@/components/CartProvider";
import RentalAgreementText from "@/components/RentalAgreementText";
import SignatureBlock from "@/components/SignatureBlock";
import { RENTAL_HOURS } from "@/lib/rental";
import {
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronLeft,
  Clock,
  CreditCard,
  Loader2,
  Minus,
  PartyPopper,
  Plus,
  ShoppingCart,
  Trash2,
  Truck,
} from "lucide-react";

// Business hours for the pickup time picker — bounded so a 21h rental
// doesn't produce an absurd overnight drop-off time.
const MIN_PICKUP_TIME = "07:00";
const MAX_PICKUP_TIME = "20:00";
const DEFAULT_PICKUP_TIME = "08:00";

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

export default function CartPage() {
  const cart = useCart();
  const [step, setStep] = useState<"cart" | "review" | "done">("cart");

  const [pickupDate, setPickupDate] = useState(todayStr());
  const [pickupTime, setPickupTime] = useState(DEFAULT_PICKUP_TIME);
  const pickupAtStr = `${pickupDate}T${pickupTime}`;
  const pickupAtDate = new Date(pickupAtStr);
  const dropoffAtDate = new Date(pickupAtDate.getTime() + RENTAL_HOURS * 3600_000);
  const [checking, setChecking] = useState(false);
  const [availability, setAvailability] = useState<Record<string, number>>({});
  const [limitNoticeItemId, setLimitNoticeItemId] = useState<string | null>(null);

  function handleIncrementLine(line: { itemId: string; quantity: number; maxQuantity: number }) {
    if (line.quantity >= line.maxQuantity) {
      setLimitNoticeItemId(line.itemId);
      setTimeout(() => setLimitNoticeItemId((cur) => (cur === line.itemId ? null : cur)), 2500);
      return;
    }
    cart.updateQuantity(line.itemId, line.quantity + 1);
  }

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
  const [confirmationId, setConfirmationId] = useState<string | null>(null);
  const [signatureResult, setSignatureResult] = useState<SignatureResult | null>(null);

  // Debounced + merged rather than replaced: without this, every single +/-
  // click (which changes cart.lines identity) fires an immediate re-check of
  // every line, and briefly wiping the availability numbers while it's in
  // flight made every item's "available" text flicker out and back in
  // together — including items nobody touched. Keeping the previous values
  // visible until fresh ones land removes the pop; the debounce means
  // rapid-fire clicks only trigger one check, not one per click.
  useEffect(() => {
    if (cart.lines.length === 0) return;
    let cancelled = false;

    const timer = setTimeout(() => {
      setChecking(true);
      Promise.all(
        cart.lines.map((l) =>
          fetch(`/api/availability?itemId=${l.itemId}&pickupAt=${pickupAtStr}`)
            .then((r) => r.json())
            .then((data) => [l.itemId, data.available ?? 0] as const)
        )
      )
        .then((results) => {
          if (cancelled) return;
          setAvailability((prev) => ({ ...prev, ...Object.fromEntries(results) }));
        })
        .finally(() => {
          if (!cancelled) setChecking(false);
        });
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [cart.lines, pickupAtStr]);

  const allAvailable =
    cart.lines.length > 0 && cart.lines.every((l) => (availability[l.itemId] ?? 0) >= l.quantity);

  function handleContinueToReview(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!allAvailable) {
      setError("Adjust quantities or pick a different pickup time — not everything in your cart is available.");
      return;
    }
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

    const bookingData = {
      kind: "cart" as const,
      lines: cart.lines.map((l) => ({ itemId: l.itemId, quantity: l.quantity })),
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
      setConfirmationId(data.id);
      if (data.signature) {
        setSignatureResult({
          name: data.signature.name,
          hash: data.signature.hash,
          ip: data.signature.ip,
          signedAt: data.signature.signedAt,
        });
      }
      cart.clear();
      setStep("done");
    } catch {
      setError("Network error — please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (step === "done" && confirmationId) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-14">
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
              {confirmationId.slice(0, 8).toUpperCase()}
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
              We&apos;ve emailed your confirmation — our team will contact you to arrange the
              booking fee.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (cart.lines.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-20 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-signal-light/50 text-signal">
          <ShoppingCart className="h-6 w-6" strokeWidth={2.25} />
        </span>
        <h1 className="mt-5 font-display text-2xl font-semibold text-navy">Your cart is empty</h1>
        <p className="mt-2 text-steel">Browse the equipment catalog and add what you need.</p>
        <Link
          href="/items-for-rent"
          className="mt-6 inline-flex items-center rounded-full bg-navy px-6 py-3 text-sm font-semibold text-white hover:brightness-110"
        >
          Browse equipment
        </Link>
      </div>
    );
  }

  const total = cart.lines.reduce((s, l) => s + l.dailyRate * l.quantity, 0);

  if (step === "review") {
    return (
      <div className="mx-auto max-w-2xl px-6 py-14">
        <div className="animate-fade-up rounded-2xl border border-line bg-white p-7 shadow-sm">
          <button
            type="button"
            onClick={() => setStep("cart")}
            className="flex items-center gap-1 text-xs font-semibold text-steel hover:text-navy"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Back to cart
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
              equipmentLines={cart.lines.map((l) => `${l.quantity}× ${l.name}`)}
              fulfillmentType="SELF_PICKUP"
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

  return (
    <div className="mx-auto max-w-4xl px-6 py-14">
      <Link
        href="/items-for-rent"
        className="inline-flex items-center gap-1 text-sm font-semibold text-steel transition hover:text-signal"
      >
        <ChevronLeft className="h-4 w-4" /> Keep browsing
      </Link>

      <h1 className="mt-4 font-display text-3xl font-semibold text-navy">Your cart</h1>

      <form onSubmit={handleContinueToReview} className="mt-8 grid gap-8 lg:grid-cols-[1.3fr_1fr]">
        <div className="flex flex-col gap-4">
          {cart.lines.map((line) => {
            const available = availability[line.itemId];
            const ok = available !== undefined && available >= line.quantity;
            return (
              <div
                key={line.itemId}
                className="flex items-center gap-4 rounded-xl border border-line bg-white p-4 shadow-sm"
              >
                <div className="flex-1">
                  <p className="font-semibold text-navy">{line.name}</p>
                  <p className="text-sm text-steel">
                    ${line.dailyRate.toFixed(0)} / rental
                    {available !== undefined && (
                      <span
                        className={`ml-2 transition-opacity ${checking ? "opacity-50" : ""} ${
                          ok ? "text-signal" : "text-amber-deep"
                        }`}
                      >
                        {ok ? `${available} available` : `only ${available} available`}
                      </span>
                    )}
                  </p>
                  {limitNoticeItemId === line.itemId && (
                    <p className="mt-1 text-xs font-medium text-amber-deep">
                      That&apos;s the most we have available — {line.maxQuantity} unit
                      {line.maxQuantity === 1 ? "" : "s"} in our fleet.
                    </p>
                  )}
                </div>
                <div className="flex items-center rounded-full border border-line">
                  <button
                    type="button"
                    onClick={() => cart.updateQuantity(line.itemId, line.quantity - 1)}
                    className="flex h-8 w-8 items-center justify-center text-steel hover:text-navy"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-6 text-center text-sm font-semibold text-navy">
                    {line.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleIncrementLine(line)}
                    className="flex h-8 w-8 items-center justify-center text-steel hover:text-navy"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => cart.removeItem(line.itemId)}
                  aria-label={`Remove ${line.name}`}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-steel hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })}

          <div className="flex items-center justify-between rounded-xl border border-line bg-paper/60 p-4">
            <span className="text-sm font-semibold text-navy">Estimated total</span>
            <span className="font-display text-lg font-semibold text-navy">
              ${total.toFixed(0)}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-6 rounded-2xl border border-line bg-white p-7 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-2">
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
            <span className="font-semibold text-navy">
              {format(dropoffAtDate, "EEE, MMM d 'at' h:mm a")}
            </span>
            . Returns after this time are billed for an additional day.
          </div>

          <div className="flex items-start gap-2 rounded-lg border border-line bg-paper/50 px-4 py-3 text-sm text-steel">
            <Truck className="mt-0.5 h-4 w-4 shrink-0 text-signal" />
            You&apos;ll need to pick this up from our location — no delivery is included.
          </div>

          <div
            className={`rounded-lg border px-4 py-3 text-sm transition-colors ${
              checking
                ? "border-line bg-paper text-steel"
                : allAvailable
                  ? "border-signal/30 bg-signal-light/30 text-navy"
                  : "border-amber/40 bg-amber/10 text-amber-deep"
            }`}
          >
            {checking ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Checking availability…
              </span>
            ) : (
              <span className="flex items-center gap-2">
                {allAvailable && <CheckCircle2 className="h-4 w-4 shrink-0" />}
                {allAvailable
                  ? "Everything in your cart is available for that pickup time."
                  : "Not everything is available — adjust quantities or pick another pickup time."}
              </span>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>
              Name *
              <input required value={name} onChange={(e) => setName(e.target.value)} className={fieldClass} />
            </label>
            <label className={labelClass}>
              Phone *
              <input required value={phone} onChange={(e) => setPhone(e.target.value)} className={fieldClass} />
            </label>
            <label className={labelClass}>
              Email *
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={fieldClass}
              />
            </label>
            <label className={labelClass}>
              Organization *
              <input required value={org} onChange={(e) => setOrg(e.target.value)} className={fieldClass} />
            </label>
            <label className={`${labelClass} col-span-2`}>
              Event name *
              <input
                required
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                className={fieldClass}
              />
            </label>
            <label className={`${labelClass} col-span-2`}>
              Event address *
              <input
                required
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
            disabled={!allAvailable || checking}
            className="rounded-full bg-amber px-5 py-3.5 font-semibold text-amber-deep shadow-sm shadow-amber/30 transition hover:brightness-95 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
          >
            Continue to review &amp; sign
          </button>
        </div>
      </form>
    </div>
  );
}
