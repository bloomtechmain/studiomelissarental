"use client";

import Link from "next/link";
import { useCart } from "@/components/CartProvider";
import { ShoppingCart } from "lucide-react";

export default function CartNavLink() {
  const { count } = useCart();

  return (
    <Link
      href="/cart"
      title="Cart"
      className="relative flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white text-navy shadow-sm transition hover:-translate-y-0.5 hover:border-signal/60 hover:text-signal hover:shadow-md"
    >
      <ShoppingCart className="h-4 w-4" strokeWidth={2.25} />
      <span className="sr-only">Cart</span>
      {count > 0 && (
        <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber px-1 text-[11px] font-bold text-amber-deep">
          {count}
        </span>
      )}
    </Link>
  );
}
