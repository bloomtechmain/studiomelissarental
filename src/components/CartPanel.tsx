"use client";

import Link from "next/link";
import { useCart } from "@/components/CartProvider";
import { ShoppingCart, Minus, Plus, Trash2, ChevronRight } from "lucide-react";

export default function CartPanel() {
  const cart = useCart();
  const total = cart.lines.reduce((s, l) => s + l.dailyRate * l.quantity, 0);

  return (
    <div className="flex max-h-[calc(100vh-8rem)] flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-line px-4 py-3">
        <ShoppingCart className="h-4 w-4 text-signal" strokeWidth={2.25} />
        <p className="font-display text-base font-semibold text-navy">Your cart</p>
        <span className="ml-auto rounded-full bg-signal-light/50 px-2 py-0.5 text-xs font-bold text-signal">
          {cart.count}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        <ul className="flex flex-col divide-y divide-line/70">
          {cart.lines.map((line) => (
            <li key={line.itemId} className="flex items-center gap-3 py-3 first:pt-0">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-navy">{line.name}</p>
                <p className="text-xs text-steel">${line.dailyRate.toFixed(0)} / rental</p>
              </div>
              <div className="flex items-center rounded-full border border-line">
                <button
                  type="button"
                  onClick={() => cart.updateQuantity(line.itemId, line.quantity - 1)}
                  className="flex h-7 w-7 items-center justify-center text-steel hover:text-navy"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="w-5 text-center text-xs font-semibold text-navy">
                  {line.quantity}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    cart.updateQuantity(line.itemId, Math.min(line.quantity + 1, line.maxQuantity))
                  }
                  className="flex h-7 w-7 items-center justify-center text-steel hover:text-navy"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
              <button
                type="button"
                onClick={() => cart.removeItem(line.itemId)}
                aria-label={`Remove ${line.name}`}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-steel hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="border-t border-line px-4 py-3.5">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-navy">Estimated total</span>
          <span className="font-display text-base font-semibold text-navy">${total.toFixed(0)}</span>
        </div>
        <Link
          href="/cart"
          className="mt-3 flex items-center justify-center gap-1.5 rounded-full bg-navy px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
        >
          View cart &amp; checkout
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
