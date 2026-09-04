"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/components/CartProvider";
import { ShoppingCart, ChevronRight } from "lucide-react";

// The desktop/tablet equivalent (CartPanel, docked via ItemsForRentShell) is
// `hidden` below the `lg` breakpoint, so phone users had no way to see or
// reach their cart while browsing other pages — this is the mobile-width
// substitute: a persistent bottom bar, only below `lg`, only once something
// is actually in the cart. The spacer div keeps it from covering the last
// bit of page content (e.g. the footer) once it's showing.
export default function MobileCartBar() {
  const cart = useCart();
  const pathname = usePathname();
  if (cart.count === 0 || pathname === "/cart") return null;

  const total = cart.lines.reduce((s, l) => s + l.dailyRate * l.quantity, 0);

  return (
    <div className="lg:hidden">
      <div className="h-[68px]" aria-hidden />
      <div className="fixed inset-x-0 bottom-0 z-[1150] border-t border-line bg-white/95 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-6px_20px_rgba(15,23,42,0.12)] backdrop-blur">
        <Link
          href="/cart"
          className="flex items-center justify-between gap-3 rounded-full bg-navy px-4 py-3 text-white transition active:scale-[0.99]"
        >
          <span className="flex items-center gap-2.5 text-sm font-semibold">
            <span className="relative flex h-6 w-6 shrink-0 items-center justify-center">
              <ShoppingCart className="h-[18px] w-[18px]" strokeWidth={2} />
              <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber px-1 text-[10px] font-bold text-amber-deep">
                {cart.count}
              </span>
            </span>
            ${total.toFixed(0)}
          </span>
          <span className="flex items-center gap-1 text-sm font-semibold text-amber">
            View cart
            <ChevronRight className="h-4 w-4" />
          </span>
        </Link>
      </div>
    </div>
  );
}
