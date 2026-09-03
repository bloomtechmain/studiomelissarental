"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/components/CartProvider";
import { ShoppingCart, Minus, Plus, Trash2, X, ChevronRight } from "lucide-react";

export default function FloatingCart() {
  const cart = useCart();
  const [open, setOpen] = useState(false);

  if (cart.count === 0) return null;

  const total = cart.lines.reduce((s, l) => s + l.dailyRate * l.quantity, 0);

  return (
    <div className="fixed top-1/2 right-4 z-50 flex -translate-y-1/2 flex-col items-end gap-3 sm:right-6">
      {open && (
        <div className="animate-fade-up flex max-h-[70vh] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <p className="font-display text-base font-semibold text-navy">Your cart</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close cart"
              className="flex h-7 w-7 items-center justify-center rounded-full text-steel hover:bg-paper hover:text-navy"
            >
              <X className="h-4 w-4" />
            </button>
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
              <span className="font-display text-base font-semibold text-navy">
                ${total.toFixed(0)}
              </span>
            </div>
            <Link
              href="/cart"
              onClick={() => setOpen(false)}
              className="mt-3 flex items-center justify-center gap-1.5 rounded-full bg-navy px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
            >
              View cart &amp; checkout
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title="Cart"
        className="relative flex h-14 w-14 items-center justify-center rounded-full bg-navy text-white shadow-lg shadow-navy/30 transition hover:brightness-110 active:scale-95"
      >
        <ShoppingCart className="h-5 w-5" strokeWidth={2.25} />
        <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber px-1 text-[11px] font-bold text-amber-deep ring-2 ring-white">
          {cart.count}
        </span>
      </button>
    </div>
  );
}
