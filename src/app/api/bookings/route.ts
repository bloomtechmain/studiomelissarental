import { NextRequest, NextResponse } from "next/server";
import { bookingInputSchema } from "@/lib/validation";
import { createBooking, BookingConflictError } from "@/lib/booking";
import { InsufficientAvailabilityError } from "@/lib/availability";

// Standard proxy headers — this app has no reverse proxy of its own yet, so
// in production this is whatever the hosting platform sets. "unknown" is a
// deliberately visible fallback rather than a silently wrong value.
function clientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = bookingInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input.", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  try {
    const booking = await createBooking(parsed.data, clientIp(req));
    return NextResponse.json(
      {
        id: booking.id,
        status: booking.status,
        signature: {
          name: booking.signatureName,
          hash: booking.signatureHash,
          ip: booking.signatureIp,
          signedAt: booking.agreementSignedAt,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof InsufficientAvailabilityError || err instanceof BookingConflictError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    console.error("Booking creation failed:", err);
    return NextResponse.json({ error: "Could not create booking." }, { status: 500 });
  }
}
