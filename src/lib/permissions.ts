import type { Role } from "@prisma/client";
import type { SessionUser } from "./auth";

// Every capability the app gates behind a role, named after the resource and
// action it controls rather than a page or button — one permission can back
// several call sites (e.g. every "edit this booking" server action shares
// "bookings:write").
export type Permission =
  | "bookings:write" // status changes, reschedule, agreement/insurance, uploads
  | "bookings:financials:write" // rental fee, deposit, amount paid, refunds, charges
  | "customers:write"
  | "leads:write"
  | "quotes:write"
  | "inventory:units:write" // unit status, new units, maintenance logs
  | "bookings:units:write" // swap which serial-numbered unit is assigned to a booking — pull-sheet mechanics, not pricing, so both bookings and warehouse staff get it
  | "inventory:catalog:write" // categories, items, pricing
  | "packages:write" // package composition & pricing
  | "addons:write"
  | "settings:view"
  | "settings:write"
  | "staff:manage" // view + edit staff accounts
  | "reports:view";

// The single source of truth for what each role can do. To add a new role,
// add one entry here — every server action and page checks this table, so
// nothing else in the app needs to change.
const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  ADMIN: [
    "bookings:write",
    "bookings:financials:write",
    "customers:write",
    "leads:write",
    "quotes:write",
    "inventory:units:write",
    "bookings:units:write",
    "inventory:catalog:write",
    "packages:write",
    "addons:write",
    "settings:view",
    "settings:write",
    "staff:manage",
    "reports:view",
  ],
  // Staff — Bookings: create/edit bookings, manage customers, view inventory
  // availability. Cannot edit staff accounts or view financial reports.
  STAFF_BOOKINGS: [
    "bookings:write",
    "bookings:financials:write",
    "customers:write",
    "leads:write",
    "quotes:write",
    "bookings:units:write",
  ],
  // Staff — Warehouse/Ops: view bookings and pull sheets, update equipment
  // status. Cannot edit pricing or customer financial info.
  STAFF_WAREHOUSE: ["inventory:units:write", "bookings:units:write"],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

// For page-level view checks: `if (!can(session, "reports:view")) redirect(...)`.
export function can(session: SessionUser | null, permission: Permission): boolean {
  return !!session && hasPermission(session.role, permission);
}

// For server actions: throws the same "FORBIDDEN" error requireRole used to,
// so existing error handling elsewhere keeps working unchanged.
export function requirePermission(session: SessionUser, permission: Permission) {
  if (!hasPermission(session.role, permission)) throw new Error("FORBIDDEN");
}
