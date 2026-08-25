import { NextRequest, NextResponse } from "next/server";
import { getAvailability } from "@/lib/availability";
import { pickupAtSchema } from "@/lib/validation";
import { parsePickupAt } from "@/lib/rental";

export async function GET(req: NextRequest) {
  const itemId = req.nextUrl.searchParams.get("itemId") ?? "";
  const pickupAt = req.nextUrl.searchParams.get("pickupAt") ?? "";

  const parsedPickupAt = pickupAtSchema.safeParse(pickupAt);
  if (!itemId || !parsedPickupAt.success) {
    return NextResponse.json({ error: "Invalid itemId or pickupAt." }, { status: 400 });
  }

  const { totalEligible, availableUnitIds } = await getAvailability(
    itemId,
    parsePickupAt(parsedPickupAt.data)
  );
  return NextResponse.json({ totalEligible, available: availableUnitIds.length });
}
