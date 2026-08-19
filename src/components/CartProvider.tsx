"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type CartLine = {
  itemId: string;
  name: string;
  dailyRate: number;
  maxQuantity: number;
  quantity: number;
};

type CartContextValue = {
  lines: CartLine[];
  count: number;
  addItem: (item: Omit<CartLine, "quantity">, quantity: number) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "smr_cart_v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Cart lives in localStorage, not a cookie/DB — it's pre-checkout scratch
  // state for an anonymous browser session, never sent to the server until
  // the customer actually submits the booking.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setLines(JSON.parse(raw));
    } catch {
      // corrupt/unavailable storage — just start empty
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  }, [lines, hydrated]);

  const addItem = useCallback((item: Omit<CartLine, "quantity">, quantity: number) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.itemId === item.itemId);
      if (existing) {
        const nextQty = Math.min(existing.quantity + quantity, item.maxQuantity);
        return prev.map((l) => (l.itemId === item.itemId ? { ...l, quantity: nextQty } : l));
      }
      return [...prev, { ...item, quantity: Math.max(1, Math.min(quantity, item.maxQuantity)) }];
    });
  }, []);

  const removeItem = useCallback((itemId: string) => {
    setLines((prev) => prev.filter((l) => l.itemId !== itemId));
  }, []);

  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    setLines((prev) =>
      prev.map((l) =>
        l.itemId === itemId ? { ...l, quantity: Math.max(1, Math.min(quantity, l.maxQuantity)) } : l
      )
    );
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const count = useMemo(() => lines.reduce((s, l) => s + l.quantity, 0), [lines]);

  return (
    <CartContext.Provider value={{ lines, count, addItem, removeItem, updateQuantity, clear }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
