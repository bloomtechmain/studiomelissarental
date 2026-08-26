"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { LogIn } from "lucide-react";

const fieldClass =
  "rounded-2xl border border-line bg-white shadow-sm px-3.5 py-2.5 text-navy transition focus:border-signal focus:outline-none focus:ring-2 focus:ring-signal/15";

export default function CustomerLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/account/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Login failed.");
        return;
      }
      // A soft router.push() here can reuse a stale client-side Router
      // Cache entry for /account from before login (e.g. the header's
      // "My Account" link gets prefetched on every public page while
      // signed out) — a full navigation always re-checks the session
      // server-side instead of serving that cached pre-auth redirect.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- intentional: router.push() here re-triggers the stale-cache bug above
      window.location.href = "/account";
    } catch {
      setError("Network error — please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-dot-grid relative flex min-h-[calc(100vh-73px)] flex-col items-center justify-center bg-paper px-6 py-12">
      <div className="animate-fade-up flex flex-col items-center">
        <Image src="/logo.png" alt="Studio Melissa Rental" width={190} height={78} priority />
        <form
          onSubmit={handleSubmit}
          className="mt-8 flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-line bg-white p-8 shadow-xl shadow-navy/5"
        >
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-signal-light/50 text-signal">
              <LogIn className="h-4 w-4" strokeWidth={2.25} />
            </span>
            <div>
              <h1 className="font-display text-lg font-semibold text-navy">Sign in</h1>
              <p className="text-xs text-steel">View your rental history</p>
            </div>
          </div>
          <label className="flex flex-col gap-1.5 text-sm font-semibold text-navy">
            Email
            <input
              type="email"
              required
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={fieldClass}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-semibold text-navy">
            Password
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={fieldClass}
            />
          </label>
          {error && <p className="text-sm font-medium text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="mt-2 rounded-full bg-navy px-5 py-3 font-semibold text-white transition hover:brightness-110 active:scale-[0.99] disabled:opacity-50"
          >
            {submitting ? "Signing in…" : "Sign in"}
          </button>
          <p className="text-center text-sm text-steel">
            New here?{" "}
            <Link href="/account/signup" className="font-semibold text-signal hover:underline">
              Create an account
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
