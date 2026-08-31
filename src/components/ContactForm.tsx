"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, Mail, MessageSquare, Phone, User } from "lucide-react";

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

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState(""); // honeypot

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !email.trim() || !message.trim()) {
      setError("Name, email, and message are required.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, message, website }),
      });
      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData?.error || "Something went wrong. Please try again.");
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
          <CheckCircle2 className="h-6 w-6" strokeWidth={2.25} />
        </span>
        <h3 className="mt-4 font-display text-xl font-semibold text-navy">Message sent</h3>
        <p className="mt-2 text-sm leading-relaxed text-steel">
          Thanks{name ? `, ${name.split(" ")[0]}` : ""} — we&apos;ve got your message and will
          get back to you soon.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="animate-fade-up rounded-2xl border border-line bg-white p-7 shadow-sm"
    >
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
          <FieldLabel icon={Mail}>Email *</FieldLabel>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={fieldClass}
            placeholder="jane@email.com"
          />
        </label>
        <label className={`${labelClass} sm:col-span-2`}>
          <FieldLabel icon={Phone}>Phone</FieldLabel>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={fieldClass}
            placeholder="Optional — (512) 555-0100"
          />
        </label>
        <label className={`${labelClass} sm:col-span-2`}>
          <FieldLabel icon={MessageSquare}>Message *</FieldLabel>
          <textarea
            required
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className={`${fieldClass} min-h-32 resize-y`}
            placeholder="What can we help with?"
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
        disabled={submitting}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-navy px-6 py-3 font-semibold text-white transition hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Sending…
          </>
        ) : (
          <>
            <MessageSquare className="h-4 w-4" /> Send message
          </>
        )}
      </button>
    </form>
  );
}
