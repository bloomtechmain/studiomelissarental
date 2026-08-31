"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Volume2,
  Package,
  MessageSquareText,
  Mail,
  User,
  Menu,
  X,
} from "lucide-react";
import CartNavLink from "@/components/CartNavLink";

const NAV_LINKS = [
  { href: "/services", label: "Services", icon: Package },
  { href: "/products", label: "Products", icon: Volume2 },
  { href: "/quote", label: "Request a quote", icon: MessageSquareText },
  { href: "/contact", label: "Contact", icon: Mail },
];

export default function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <Link href="/" className="flex items-center" onClick={() => setOpen(false)}>
          <Image src="/logo.png" alt="Studio Melissa Rental" width={148} height={61} priority />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center justify-end gap-2 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-1.5 rounded-full bg-navy px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-navy/20 transition hover:-translate-y-0.5 hover:brightness-110 hover:shadow-md"
            >
              <link.icon className="h-3.5 w-3.5" strokeWidth={2.25} />
              {link.label}
            </Link>
          ))}
          <Link
            href="/account"
            title="Account"
            className="ml-3 flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white text-navy shadow-sm transition hover:-translate-y-0.5 hover:border-signal/60 hover:text-signal hover:shadow-md"
          >
            <User className="h-4 w-4" strokeWidth={2.25} />
            <span className="sr-only">Account</span>
          </Link>
          <CartNavLink />
        </nav>

        {/* Mobile controls */}
        <div className="flex items-center gap-2 lg:hidden">
          <CartNavLink />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white text-navy shadow-sm transition hover:border-signal/60 hover:text-signal"
          >
            {open ? (
              <X className="h-5 w-5" strokeWidth={2.25} />
            ) : (
              <Menu className="h-5 w-5" strokeWidth={2.25} />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu panel */}
      {open && (
        <div className="border-t border-line bg-paper lg:hidden">
          <nav className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-4">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-xl bg-navy px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-navy/20 transition hover:brightness-110"
              >
                <link.icon className="h-4 w-4" strokeWidth={2.25} />
                {link.label}
              </Link>
            ))}
            <Link
              href="/account"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-xl border border-line bg-white px-4 py-3 text-sm font-semibold text-navy shadow-sm transition hover:border-signal/60 hover:text-signal"
            >
              <User className="h-4 w-4" strokeWidth={2.25} />
              Account
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
