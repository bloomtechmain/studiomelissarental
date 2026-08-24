import { NextRequest, NextResponse } from "next/server";
import { bookingInputSchema } from "@/lib/validation";
import { createBooking, BookingConflictError } from "@/lib/booking";
import { InsufficientAvailabilityError } from "@/lib/availability";
import { readPngDimensions } from "@/lib/png";

const SIGNATURE_WIDTH = 772;
const SIGNATURE_HEIGHT = 229;
const SIGNATURE_MAX_BYTES = 500 * 1024;

// Standard proxy headers — this app has no reverse proxy of its own yet, so
// in production this is whatever the hosting platform sets. "unknown" is a
// deliberately visible fallback rather than a silently wrong value.
function clientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

export async function POST(req: NextRequest) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data." }, { status: 400 });
  }

  let body: unknown;
  try {
    body = JSON.parse(String(form.get("data") ?? "{}"));
  } catch {
    return NextResponse.json({ error: "Invalid form data." }, { status: 400 });
  }

  const parsed = bookingInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input.", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const signatureFile = form.get("signature");
  if (!(signatureFile instanceof File) || signatureFile.size === 0) {
    return NextResponse.json({ error: "A signature is required." }, { status: 400 });
  }
  if (signatureFile.type !== "image/png") {
    return NextResponse.json({ error: "Signature must be a PNG image." }, { status: 400 });
  }
  if (signatureFile.size > SIGNATURE_MAX_BYTES) {
    return NextResponse.json({ error: "Signature image is too large (500KB max)." }, { status: 400 });
  }
  const signatureBuffer = Buffer.from(await signatureFile.arrayBuffer());
  const dimensions = readPngDimensions(signatureBuffer);
  if (!dimensions || dimensions.width !== SIGNATURE_WIDTH || dimensions.height !== SIGNATURE_HEIGHT) {
    return NextResponse.json(
      { error: `Signature image must be exactly ${SIGNATURE_WIDTH}x${SIGNATURE_HEIGHT}px.` },
      { status: 400 }
    );
  }

  try {
    const booking = await createBooking(parsed.data, clientIp(req), signatureBuffer);
    return NextResponse.json(
      {
        id: booking.id,
        status: booking.status,
        signature: {
          name: booking.signatureName,
          hash: booking.signatureHash,
          ip: booking.signatureIp,
          signedAt: booking.agreementSignedAt,
          imageUrl: booking.signatureImageUrl,
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
