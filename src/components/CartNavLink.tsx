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
      className="relative flex h-9 w-9 items-center justify-center text-white/85 transition hover:text-amber"
    >
      <ShoppingCart className="h-[19px] w-[19px]" strokeWidth={2} />
      <span className="sr-only">Cart</span>
      {count > 0 && (
        <span className="absolute top-0 right-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber px-1 text-[10px] font-bold text-amber-deep">
          {count}
        </span>
      )}
    </Link>
  );
}
