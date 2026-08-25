import { NextRequest, NextResponse } from "next/server";
import { getPackageAvailability } from "@/lib/availability";
import { pickupAtSchema } from "@/lib/validation";
import { parsePickupAt } from "@/lib/rental";

export async function GET(req: NextRequest) {
  const packageId = req.nextUrl.searchParams.get("packageId") ?? "";
  const pickupAt = req.nextUrl.searchParams.get("pickupAt") ?? "";

  const parsedPickupAt = pickupAtSchema.safeParse(pickupAt);
  if (!packageId || !parsedPickupAt.success) {
    return NextResponse.json({ error: "Invalid packageId or pickupAt." }, { status: 400 });
  }

  const result = await getPackageAvailability(packageId, parsePickupAt(parsedPickupAt.data));
  return NextResponse.json(result);
}
