"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

// `icon` is a pre-rendered element (built server-side in layout.tsx), not a
// component reference — Server Components can't pass bare function/component
// references as props to a Client Component like this one, only already
//-rendered ReactNode elements.
type NavItem = { href: string; label: string; icon: ReactNode };

export default function AdminNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 flex-col gap-1 p-3">
      {items.map((item) => {
        // "/admin" (Dashboard) must match exactly, or every page would light
        // it up too — every other section highlights for its own sub-pages
        // as well (e.g. /admin/leads/123 still highlights "Leads").
        const active =
          item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
              active
                ? "bg-white/10 text-white"
                : "text-signal-light/85 hover:bg-white/10 hover:text-white"
            }`}
          >
            {item.icon}
            {item.label}
            {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-amber" />}
          </Link>
        );
      })}
    </nav>
  );
}
