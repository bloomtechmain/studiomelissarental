"use client";

import { useCart } from "@/components/CartProvider";
import CartPanel from "@/components/CartPanel";

// Dedicated right-side column for the cart on items-for-rent pages — not a
// floating overlay, so it never covers the "Add to cart" buttons in the
// list below it. Only reserves the column once something's actually in
// the cart.
export default function ItemsForRentShell({ children }: { children: React.ReactNode }) {
  const cart = useCart();
  const showDock = cart.count > 0;

  return (
    <div className={showDock ? "lg:grid lg:grid-cols-[1fr_300px] lg:items-start lg:gap-8" : ""}>
      <div className="min-w-0">{children}</div>
      {showDock && (
        <aside className="sticky top-24 mt-8 hidden lg:mt-0 lg:block">
          <CartPanel />
        </aside>
      )}
    </div>
  );
}
