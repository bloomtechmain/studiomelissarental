import Link from "next/link";
import Image from "next/image";
import { Volume2, Package, MapPin, ChevronRight, MessageSquareText, Mail, User } from "lucide-react";
import { CartProvider } from "@/components/CartProvider";
import CartNavLink from "@/components/CartNavLink";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <header className="sticky top-0 z-50 border-b border-line bg-paper/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <Link href="/" className="flex items-center">
            <Image src="/logo.png" alt="Studio Melissa Rental" width={148} height={61} priority />
          </Link>
          <nav className="flex flex-wrap items-center justify-end gap-2.5">
            <Link
              href="/services"
              className="flex items-center gap-1.5 rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-navy shadow-sm transition hover:-translate-y-0.5 hover:border-signal/60 hover:text-signal hover:shadow-md"
            >
              <Package className="h-3.5 w-3.5" strokeWidth={2.25} />
              Services
            </Link>
            <Link
              href="/products"
              className="flex items-center gap-1.5 rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-navy shadow-sm transition hover:-translate-y-0.5 hover:border-signal/60 hover:text-signal hover:shadow-md"
            >
              <Volume2 className="h-3.5 w-3.5" strokeWidth={2.25} />
              Products
            </Link>
            <Link
              href="/quote"
              className="flex items-center gap-1.5 rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-navy shadow-sm transition hover:-translate-y-0.5 hover:border-signal/60 hover:text-signal hover:shadow-md"
            >
              <MessageSquareText className="h-3.5 w-3.5" strokeWidth={2.25} />
              Request a quote
            </Link>
            <Link
              href="/contact"
              className="flex items-center gap-1.5 rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-navy shadow-sm transition hover:-translate-y-0.5 hover:border-signal/60 hover:text-signal hover:shadow-md"
            >
              <Mail className="h-3.5 w-3.5" strokeWidth={2.25} />
              Contact
            </Link>
            <Link
              href="/account"
              className="flex items-center gap-1.5 rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-navy shadow-sm transition hover:-translate-y-0.5 hover:border-signal/60 hover:text-signal hover:shadow-md"
            >
              <User className="h-3.5 w-3.5" strokeWidth={2.25} />
              Account
            </Link>
            <CartNavLink />
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="bg-dot-grid-dark relative overflow-hidden border-t border-line bg-navy-dark text-signal-light">
        <div className="relative mx-auto grid max-w-6xl gap-12 px-6 py-16 sm:grid-cols-[1.3fr_1fr]">
          <div>
            <div className="flex items-center gap-2 text-white">
              <Volume2 className="h-5 w-5 text-signal-light" strokeWidth={2.25} />
              <p className="font-display text-lg font-semibold">Studio Melissa Rental</p>
            </div>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-signal-light/70">
              Audio &amp; PA equipment rentals for Central Texas events — delivery, setup, and
              pickup handled for every booking.
            </p>
            <span className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-signal-light">
              <MapPin className="h-3 w-3" strokeWidth={2.5} />
              Serving Central Texas
            </span>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-signal-light/50">
              Explore
            </p>
            <ul className="mt-3 space-y-2.5 text-sm">
              <li>
                <Link
                  href="/services"
                  className="group inline-flex items-center gap-1 text-signal-light/85 transition hover:text-white"
                >
                  Services
                  <ChevronRight className="h-3.5 w-3.5 opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
                </Link>
              </li>
              <li>
                <Link
                  href="/products"
                  className="group inline-flex items-center gap-1 text-signal-light/85 transition hover:text-white"
                >
                  Products
                  <ChevronRight className="h-3.5 w-3.5 opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
                </Link>
              </li>
              <li>
                <Link
                  href="/quote"
                  className="group inline-flex items-center gap-1 text-signal-light/85 transition hover:text-white"
                >
                  Request a quote
                  <ChevronRight className="h-3.5 w-3.5 opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="group inline-flex items-center gap-1 text-signal-light/85 transition hover:text-white"
                >
                  Contact us
                  <ChevronRight className="h-3.5 w-3.5 opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="relative border-t border-white/10">
          <p className="mx-auto max-w-6xl px-6 py-5 text-xs text-signal-light/40">
            © {new Date().getFullYear()} Studio Melissa Rental, LLC.
          </p>
        </div>
      </footer>
    </CartProvider>
  );
}
