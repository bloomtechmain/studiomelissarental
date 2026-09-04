import Image from "next/image";
import { getSession } from "@/lib/auth";
import { can, type Permission } from "@/lib/permissions";
import LogoutButton from "./LogoutButton";
import AdminNav from "./AdminNav";
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
  PiggyBank,
  Images,
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
  {
    href: "/admin/gallery",
    label: "Gallery",
    icon: Images,
    permission: "gallery:write",
  },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/reports", label: "Reports", icon: BarChart3 },
  {
    href: "/admin/accounting",
    label: "Accounting",
    icon: PiggyBank,
    permission: "accounting:view",
  },
  { href: "/admin/staff", label: "Staff", icon: UserCog, permission: "staff:manage" },
  { href: "/admin/settings", label: "Settings", icon: Settings, permission: "settings:view" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  const nav = NAV.filter((item) => !item.permission || can(session, item.permission)).map(
    (item) => ({
      href: item.href,
      label: item.label,
      icon: <item.icon className="h-4 w-4" strokeWidth={2} />,
    })
  );

  return (
    <div className="bg-dot-grid flex min-h-screen bg-paper">
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
        <AdminNav items={nav} />
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
