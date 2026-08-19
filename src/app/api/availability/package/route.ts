import { NextRequest, NextResponse } from "next/server";
import { getPackageAvailability } from "@/lib/availability";
import { dateStrSchema, slotSchema } from "@/lib/validation";

export async function GET(req: NextRequest) {
  const packageId = req.nextUrl.searchParams.get("packageId") ?? "";
  const date = req.nextUrl.searchParams.get("date") ?? "";
  const slot = req.nextUrl.searchParams.get("slot") ?? "";

  const parsedDate = dateStrSchema.safeParse(date);
  const parsedSlot = slotSchema.safeParse(slot);
  if (!packageId || !parsedDate.success || !parsedSlot.success) {
    return NextResponse.json({ error: "Invalid packageId, date, or slot." }, { status: 400 });
  }

  const result = await getPackageAvailability(packageId, parsedDate.data, parsedSlot.data);
  return NextResponse.json(result);
}
