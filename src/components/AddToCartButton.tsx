"use client";

import { useState } from "react";
import { useCart } from "@/components/CartProvider";
import { ShoppingCart, Check, Minus, Plus } from "lucide-react";

export default function AddToCartButton({
  itemId,
  name,
  dailyRate,
  maxQuantity,
  compact = false,
}: {
  itemId: string;
  name: string;
  dailyRate: number;
  maxQuantity: number;
  compact?: boolean;
}) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  function handleAdd(e?: React.SyntheticEvent) {
    e?.preventDefault();
    e?.stopPropagation();
    if (maxQuantity <= 0) return;
    addItem({ itemId, name, dailyRate, maxQuantity }, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  if (maxQuantity <= 0) {
    return <span className="text-xs font-medium text-steel">No units available</span>;
  }

  if (compact) {
    return (
      <button
        type="button"
        onClick={handleAdd}
        title="Add 1 to cart"
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors duration-200 ${
          added ? "bg-signal text-white" : "bg-paper text-steel hover:bg-signal-light/60 hover:text-signal"
        }`}
      >
        {added ? <Check className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center rounded-full border border-line">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            setQuantity((q) => Math.max(1, q - 1));
          }}
          className="flex h-8 w-8 items-center justify-center text-steel hover:text-navy"
        >
          <Minus className="h-3 w-3" />
        </button>
        <span className="w-6 text-center text-sm font-semibold text-navy">{quantity}</span>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            setQuantity((q) => Math.min(maxQuantity, q + 1));
          }}
          className="flex h-8 w-8 items-center justify-center text-steel hover:text-navy"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>
      <button
        type="button"
        onClick={handleAdd}
        className={`flex flex-1 items-center justify-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-white transition active:scale-[0.99] ${
          added ? "bg-signal" : "bg-navy hover:brightness-110"
        }`}
      >
        {added ? (
          <>
            <Check className="h-4 w-4" /> Added
          </>
        ) : (
          <>
            <ShoppingCart className="h-4 w-4" /> Add to cart
          </>
        )}
      </button>
    </div>
  );
}
