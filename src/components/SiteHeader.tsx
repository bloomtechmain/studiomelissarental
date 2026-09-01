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
  { href: "/items-for-rent", label: "Items for rent", icon: Volume2 },
  { href: "/quote", label: "Request a quote", icon: MessageSquareText },
  { href: "/contact", label: "Contact", icon: Mail },
];

export default function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-[1100] bg-navy-dark shadow-lg shadow-black/30">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5 sm:px-8">
        <Link href="/" className="flex shrink-0 items-center" onClick={() => setOpen(false)}>
          <Image
            src="/logo.png"
            alt="Studio Melissa Rental"
            width={148}
            height={61}
            priority
            className="h-9 w-auto brightness-0 invert sm:h-10"
          />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center lg:flex">
          <div className="flex items-center gap-9">
            {NAV_LINKS.filter((link) => link.href !== "/quote").map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="group relative py-2 text-sm font-medium text-white/85 transition-colors hover:text-white"
              >
                {link.label}
                <span className="pointer-events-none absolute inset-x-0 -bottom-0.5 h-px origin-left scale-x-0 bg-amber transition-transform duration-200 ease-out group-hover:scale-x-100" />
              </Link>
            ))}
          </div>

          <Link
            href="/quote"
            className="ml-8 flex items-center gap-1.5 rounded-full bg-amber px-5 py-2.5 text-sm font-semibold text-amber-deep shadow-sm shadow-amber/20 transition hover:brightness-105 active:scale-[0.98]"
          >
            Request a quote
          </Link>

          <div className="ml-6 flex items-center gap-4 border-l border-white/15 pl-6">
            <Link
              href="/account"
              title="Account"
              className="flex h-9 w-9 items-center justify-center text-white/85 transition hover:text-amber"
            >
              <User className="h-[19px] w-[19px]" strokeWidth={2} />
              <span className="sr-only">Account</span>
            </Link>
            <CartNavLink />
          </div>
        </nav>

        {/* Mobile controls */}
        <div className="flex items-center gap-4 lg:hidden">
          <CartNavLink />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="flex h-9 w-9 items-center justify-center text-white/85 transition hover:text-amber"
          >
            {open ? (
              <X className="h-5 w-5" strokeWidth={2} />
            ) : (
              <Menu className="h-5 w-5" strokeWidth={2} />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu panel */}
      {open && (
        <div className="border-t border-white/10 bg-navy-dark lg:hidden">
          <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-6 py-4">
            {NAV_LINKS.filter((link) => link.href !== "/quote").map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-3 py-3 text-sm font-medium text-white/85 transition hover:bg-white/5 hover:text-white"
              >
                <link.icon className="h-4 w-4 text-white/50" strokeWidth={2} />
                {link.label}
              </Link>
            ))}
            <Link
              href="/account"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-3 text-sm font-medium text-white/85 transition hover:bg-white/5 hover:text-white"
            >
              <User className="h-4 w-4 text-white/50" strokeWidth={2} />
              Account
            </Link>
            <Link
              href="/quote"
              onClick={() => setOpen(false)}
              className="mt-2 flex items-center justify-center gap-1.5 rounded-full bg-amber px-5 py-3 text-sm font-semibold text-amber-deep shadow-sm shadow-amber/20 transition hover:brightness-105"
            >
              Request a quote
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
