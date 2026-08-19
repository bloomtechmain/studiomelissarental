import { NextRequest, NextResponse } from "next/server";
import { getAvailability } from "@/lib/availability";
import { dateStrSchema, slotSchema } from "@/lib/validation";

export async function GET(req: NextRequest) {
  const itemId = req.nextUrl.searchParams.get("itemId") ?? "";
  const date = req.nextUrl.searchParams.get("date") ?? "";
  const slot = req.nextUrl.searchParams.get("slot") ?? "";

  const parsedDate = dateStrSchema.safeParse(date);
  const parsedSlot = slotSchema.safeParse(slot);
  if (!itemId || !parsedDate.success || !parsedSlot.success) {
    return NextResponse.json({ error: "Invalid itemId, date, or slot." }, { status: 400 });
  }

  const { totalEligible, availableUnitIds } = await getAvailability(
    itemId,
    parsedDate.data,
    parsedSlot.data
  );
  return NextResponse.json({ totalEligible, available: availableUnitIds.length });
}
