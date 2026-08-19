export type SlotKey = "MORNING" | "AFTERNOON";

export const SLOTS: Record<SlotKey, { label: string; startHour: number; endHour: number }> = {
  MORNING: { label: "8:00 AM – 6:00 PM", startHour: 8, endHour: 18 },
  AFTERNOON: { label: "3:00 PM – 12:00 AM", startHour: 15, endHour: 24 },
};

// date is a "YYYY-MM-DD" string interpreted as wall-clock local time.
// endHour of 24 means midnight at the start of the following day.
export function slotWindow(dateStr: string, slot: SlotKey): { startAt: Date; endAt: Date } {
  const { startHour, endHour } = SLOTS[slot];
  const [y, m, d] = dateStr.split("-").map(Number);
  const startAt = new Date(y, m - 1, d, startHour, 0, 0, 0);
  const endAt =
    endHour === 24
      ? new Date(y, m - 1, d + 1, 0, 0, 0, 0)
      : new Date(y, m - 1, d, endHour, 0, 0, 0);
  return { startAt, endAt };
}

export function slotOptions(): { value: SlotKey; label: string }[] {
  return (Object.keys(SLOTS) as SlotKey[]).map((value) => ({
    value,
    label: SLOTS[value].label,
  }));
}
