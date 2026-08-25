// Every rental is a rolling window: the customer picks any pickup time, the
// rental runs a fixed number of hours from there, and (separately, applied
// only to BookingUnit.blockedUntil — see src/lib/availability.ts) a buffer
// keeps the unit reserved a bit longer for cleaning/inspection before it can
// go out again. This replaced the old fixed MORNING/AFTERNOON slot system.
export const RENTAL_HOURS = 21;

export function rentalWindow(pickupAt: Date): { startAt: Date; endAt: Date } {
  return { startAt: pickupAt, endAt: new Date(pickupAt.getTime() + RENTAL_HOURS * 3600_000) };
}

// The inverse of the local-midnight Date construction used throughout this
// app (e.g. `new Date(y, m-1, d)`). Reading a date back via
// `.toISOString().slice(0, 10)` is WRONG here — toISOString converts to UTC
// first, which shifts the calendar day for any timezone behind UTC. Always
// pair local-midnight construction with this, not that.
export function toDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}

// A "YYYY-MM-DDTHH:mm" string — exactly what a native
// `<input type="datetime-local">` produces, and (per the JS spec) parsed by
// `new Date(...)` as local wall-clock time, same convention as toDateStr's
// inverse (unlike a date-only "YYYY-MM-DD" string, which parses as UTC).
export const PICKUP_AT_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

export function parsePickupAt(pickupAtStr: string): Date {
  return new Date(pickupAtStr);
}
