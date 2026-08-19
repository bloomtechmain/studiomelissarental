import Link from "next/link";
import Image from "next/image";
import { getSession } from "@/lib/auth";
import { can, type Permission } from "@/lib/permissions";
import LogoutButton from "./LogoutButton";
import {
  LayoutDashboard,
  CalendarDays,
  ClipboardList,
  Package,
  Users,
  Settings,
  Target,
  FileText,
  Tag,
  BarChart3,
  Grid3x3,
  UserCog,
} from "lucide-react";

// `permission` is omitted for items every logged-in role can view (they're
// only write-gated at the action level). Items with a permission are hidden
// entirely from roles that lack it, rather than showing a dead-end link.
const NAV: { href: string; label: string; icon: typeof LayoutDashboard; permission?: Permission }[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/leads", label: "Leads", icon: Target },
  { href: "/admin/quotes", label: "Quotes", icon: FileText },
  { href: "/admin/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/admin/equipment-timeline", label: "Equipment timeline", icon: Grid3x3 },
  { href: "/admin/bookings", label: "Bookings", icon: ClipboardList },
  { href: "/admin/inventory", label: "Inventory", icon: Package },
  { href: "/admin/addons", label: "Add-ons", icon: Tag },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/reports", label: "Reports", icon: BarChart3, permission: "reports:view" },
  { href: "/admin/staff", label: "Staff", icon: UserCog, permission: "staff:manage" },
  { href: "/admin/settings", label: "Settings", icon: Settings, permission: "settings:view" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  const nav = NAV.filter((item) => !item.permission || can(session, item.permission));

  return (
    <div className="flex min-h-screen bg-paper">
      <aside className="flex w-64 flex-col border-r border-line bg-navy text-signal-light">
        <div className="border-b border-white/10 px-5 py-5">
          <Image
            src="/logo.png"
            alt="Studio Melissa Rental"
            width={128}
            height={53}
            className="rounded-md bg-white px-2 py-2.5"
          />
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {nav.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-signal-light/85 transition hover:bg-white/10 hover:text-white"
              >
                <Icon className="h-4 w-4" strokeWidth={2} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-signal text-xs font-bold text-white">
              {session?.name?.charAt(0) ?? "?"}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{session?.name}</p>
              <p className="truncate text-xs text-signal-light/60">
                {session?.role.replace("_", " ")}
              </p>
            </div>
          </div>
          <LogoutButton />
        </div>
      </aside>
      <main className="flex-1 px-8 py-8">{children}</main>
    </div>
  );
}
