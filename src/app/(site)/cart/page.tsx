"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { useCart } from "@/components/CartProvider";
import RentalAgreementText from "@/components/RentalAgreementText";
import SignatureBlock from "@/components/SignatureBlock";
import { SLOTS, type SlotKey } from "@/lib/slots";
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  CreditCard,
  Loader2,
  Minus,
  PartyPopper,
  Plus,
  ShoppingCart,
  Sun,
  Moon,
  Trash2,
  Upload,
} from "lucide-react";

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

export default function CartPage() {
  const cart = useCart();
  const [step, setStep] = useState<"cart" | "review" | "done">("cart");

  const [date, setDate] = useState(todayStr());
  const [slot, setSlot] = useState<SlotKey>("MORNING");
  const [checking, setChecking] = useState(false);
  const [availability, setAvailability] = useState<Record<string, number>>({});

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [org, setOrg] = useState("");
  const [eventName, setEventName] = useState("");
  const [eventAddress, setEventAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [signatureName, setSignatureName] = useState("");
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  const [signatureFileError, setSignatureFileError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmationId, setConfirmationId] = useState<string | null>(null);
  const [signatureResult, setSignatureResult] = useState<
    (SignatureResult & { imageDataUrl?: string }) | null
  >(null);

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
          fetch(`/api/availability?itemId=${l.itemId}&date=${date}&slot=${slot}`)
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
  }, [cart.lines, date, slot]);

  const allAvailable =
    cart.lines.length > 0 && cart.lines.every((l) => (availability[l.itemId] ?? 0) >= l.quantity);

  function handleContinueToReview(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!allAvailable) {
      setError("Adjust quantities or pick a different date/slot — not everything in your cart is available.");
      return;
    }
    if (!signatureName.trim()) setSignatureName(name.trim());
    setStep("review");
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
    if (!signatureName.trim()) {
      setError("Type your printed name to sign.");
      return;
    }
    if (!signatureFile) {
      setError("Upload your signature image to sign.");
      return;
    }
    setSubmitting(true);
    setError(null);

    const bookingData = {
      kind: "cart" as const,
      lines: cart.lines.map((l) => ({ itemId: l.itemId, quantity: l.quantity })),
      date,
      slot,
      eventName,
      eventAddress,
      notes,
      customer: { name, email, phone, org },
      signatureName: signatureName.trim(),
    };

    try {
      const imageDataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("Could not read signature image."));
        reader.readAsDataURL(signatureFile);
      });

      const formData = new FormData();
      formData.set("data", JSON.stringify(bookingData));
      formData.set("signature", signatureFile, "signature.png");

      const res = await fetch("/api/bookings", { method: "POST", body: formData });
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
          imageDataUrl,
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
              {signatureResult.imageDataUrl && (
                <img
                  src={signatureResult.imageDataUrl}
                  alt="Your signature"
                  className="mt-3 w-full rounded-lg border border-line bg-white"
                />
              )}
            </div>
          )}

          <div className="mt-5 rounded-lg border border-dashed border-line bg-paper/60 p-4">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-navy">
              <CreditCard className="h-4 w-4 text-steel" /> Payment
            </p>
            <p className="mt-1 text-xs leading-relaxed text-steel">
              Online payment isn&apos;t live yet — our team will follow up to collect the booking
              fee.
            </p>
            <button
              type="button"
              disabled
              className="mt-3 w-full cursor-not-allowed rounded-full border border-line bg-white px-5 py-3 text-sm font-semibold text-steel opacity-60"
            >
              Continue to payment (coming soon)
            </button>
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
          href="/#catalog"
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
            Please review the agreement below, then upload your signature to sign it electronically.
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
              deliveryLabel={`${format(new Date(`${date}T00:00:00`), "MMM d, yyyy")} — ${
                SLOTS[slot].label.split(" – ")[0].trim()
              }`}
              pickupLabel={`${format(new Date(`${date}T00:00:00`), "MMM d, yyyy")} — ${
                SLOTS[slot].label.split(" – ")[1].trim()
              }`}
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
            disabled={submitting || !signatureName.trim() || !signatureFile}
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
        href="/#catalog"
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
                    onClick={() => cart.updateQuantity(line.itemId, line.quantity + 1)}
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
                  ? "Everything in your cart is available for that date/slot."
                  : "Not everything is available — adjust quantities or pick another date/slot."}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <label className={labelClass}>
              Name
              <input required value={name} onChange={(e) => setName(e.target.value)} className={fieldClass} />
            </label>
            <label className={labelClass}>
              Phone
              <input required value={phone} onChange={(e) => setPhone(e.target.value)} className={fieldClass} />
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
