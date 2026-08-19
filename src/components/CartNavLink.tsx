"use client";

import Link from "next/link";
import { useCart } from "@/components/CartProvider";
import { ShoppingCart } from "lucide-react";

export default function CartNavLink() {
  const { count } = useCart();

  return (
    <Link
      href="/cart"
      className="relative flex items-center gap-1.5 rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-navy shadow-sm transition hover:-translate-y-0.5 hover:border-signal/60 hover:text-signal hover:shadow-md"
    >
      <ShoppingCart className="h-3.5 w-3.5" strokeWidth={2.25} />
      Cart
      {count > 0 && (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-signal px-1 text-[11px] font-bold text-white">
          {count}
        </span>
      )}
    </Link>
  );
}
