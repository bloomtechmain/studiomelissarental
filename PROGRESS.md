# Studio Melissa Rental — Build Progress

## Status: v1 core feature-complete and verified working

Everything in the locked v1 scope is built, migrated, seeded, and has been
tested end-to-end (both via direct API/DB scripts and by actually driving
the app in a browser — real form submission → confirmation → shows up
correctly in admin).

## Decisions locked in (confirmed with you)
- **Scope for v1**: core only — public inventory catalog + booking, admin calendar,
  inventory CRUD, basic customer records. Leads pipeline, quote PDFs, e-signature,
  online payments, and reporting (all in the full CRM spec doc) are deferred.
- **Time slots**: two fixed daily rental windows, intentionally overlapping:
  - Morning/Day: 8:00 AM – 6:00 PM
  - Afternoon/Night: 3:00 PM – 12:00 AM
- **Buffer rule**: after a unit's scheduled return, it is not immediately bookable
  again — a configurable buffer (default 3 hours, admin-editable in Settings,
  per-item override possible) must pass first. Tested: with the buffer raised
  to 12h, booking all units in an AFTERNOON slot correctly blocks the very next
  MORNING slot but frees up again by the following AFTERNOON — this is exactly
  the "all 3 out today, back tomorrow, but can't re-rent tomorrow morning" case
  from your original prompt.
- **Stack**: Next.js 16 (App Router, TypeScript), Postgres via Prisma ORM.
- **Database**: local Postgres 18, Windows service, `postgresql://postgres:postgres@localhost:5432/studio_melissa_rental`.
- **Deployment**: AWS, later — not set up yet, per your instruction.

## What's built

### Double-booking prevention (defense in depth)
1. **Database level**: Postgres `EXCLUDE` constraint (via `btree_gist`) on
   `BookingUnit(unitId, tsrange(blockedFrom, blockedUntil))` — physically
   impossible to insert two overlapping assignments for the same unit, even
   under concurrent requests. Verified with a raw script that bypasses the
   app layer entirely and confirmed Postgres rejects the second insert.
2. **Application level**: `src/lib/availability.ts` checks free units before
   assigning, inside a transaction, and throws a clear error if stock is
   insufficient. `src/lib/booking.ts` catches the rare race-condition case
   where the DB constraint fires and returns a friendly "just got booked"
   message instead of a raw DB error.

### Database schema (`prisma/schema.prisma`)
User (role-based: Admin/Staff-Bookings/Staff-Warehouse), Category, Item,
EquipmentUnit (serial-numbered physical units — what actually gets booked),
MaintenanceLog, Package + PackageItem (Huddle/Gathering/Hall/Field tiers),
Customer, Booking, BookingLine, BookingUnit, Setting.

### Public site (`src/app/(site)/`)
- `/` — package tier cards + full equipment catalog grouped by category.
- `/items/[id]` and `/packages/[id]` — detail page with a live booking widget
  (date + slot picker, real-time availability check via `/api/availability`,
  full customer/event form, submits to `/api/bookings`).
- Package booking creates one `BookingLine` per component and assigns units
  for all of them in a single transaction — all-or-nothing.

### Admin panel (`src/app/admin/`)
- `/admin/login` — session cookie auth (JWT via `jose`, bcrypt password hash).
- `/admin` — dashboard: pending bookings, upcoming (7 days), out on rental,
  in maintenance.
- `/admin/calendar` — month grid, color-coded by status, click through to a booking.
- `/admin/bookings` (+ `/[id]`) — filterable list, status workflow
  (Pending → Confirmed → Out → Returned → Completed, or Cancel at any point
  before Out — cancelling immediately frees the assigned units), booking
  detail shows the pull sheet (assigned serial numbers).
- `/admin/inventory` (+ `/new`, `/[id]`) — categories, items, per-unit status
  (Available/Out/Maintenance/Retired), maintenance log with resolve flow.
- `/admin/customers` (+ `/[id]`) — search, edit, tags, notes, booking history.
- `/admin/settings` — global buffer-hours control.
- Route protection via `src/proxy.ts` (Next.js 16's replacement for
  `middleware.ts`) — redirects unauthenticated requests to `/admin/login`.
  All mutating server actions in `actions.ts` also re-check session + role
  server-side (defense in depth beyond the route guard).

### Seed data (`prisma/seed.ts`)
Admin login: **admin@studiomelissarental.com / admin123**. Five equipment
categories, seven items with realistic unit counts, and the four package
tiers with real component lists.

## How to run it
```
cd D:\Melissa\app
npm run dev
```
Then visit http://localhost:3000 (public site) or http://localhost:3000/admin
(staff login).

## Deferred (per locked v1 scope, from the fuller CRM spec doc)
Lead intake/pipeline (website form → lead → opportunity), quoting module
with PDF generation, e-signature on the rental agreement, online payment
collection (Stripe), revenue reporting, audit trail, add-on line items /
discounts as a separate pricing layer. The schema and code are structured so
these can be layered on later without a rework — e.g. `Booking.status` and
role enum already anticipate the fuller pipeline.

## Known non-issues
- `npx tsc --noEmit` alone shows one `LayoutProps` error — this is Next.js's
  typed-routes global, generated into `.next/types` on the first `next dev`
  or `next build` run. It's not a real error; `npm run build` (which runs
  its own typecheck after generating types) is clean.
