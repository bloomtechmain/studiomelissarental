import { NextRequest, NextResponse } from "next/server";
import { bookingInputSchema } from "@/lib/validation";
import { createBooking, BookingConflictError } from "@/lib/booking";
import { InsufficientAvailabilityError } from "@/lib/availability";

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
    const booking = await createBooking(parsed.data);
    return NextResponse.json({ id: booking.id, status: booking.status }, { status: 201 });
  } catch (err) {
    if (err instanceof InsufficientAvailabilityError || err instanceof BookingConflictError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    console.error("Booking creation failed:", err);
    return NextResponse.json({ error: "Could not create booking." }, { status: 500 });
  }
}
