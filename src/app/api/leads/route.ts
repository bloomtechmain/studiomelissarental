import { NextRequest, NextResponse } from "next/server";
import { leadInputSchema } from "@/lib/validation";
import { prisma } from "@/lib/prisma";
import { generateSignatureCode } from "@/lib/signatureEncryption";
import { sendQuoteRequestNotification } from "@/lib/email";

// Same extraction used by /api/bookings — Cloudflare/nginx sit in front of
// this app, so req.ip isn't available; the real client address is forwarded.
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
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = leadInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input.", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const data = parsed.data;

  // Honeypot: bots fill every field, real visitors never see this one.
  // Return a fake success so bots don't learn to avoid it.
  if (data.website) {
    return NextResponse.json({ ok: true }, { status: 201 });
  }

  const ip = clientIp(req);
  const signedAt = new Date();
  const { code } = generateSignatureCode({
    name: data.signatureName,
    contact: data.email,
    ip,
    timestamp: signedAt,
  });

  const lead = await prisma.lead.create({
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone,
      eventDate: new Date(`${data.eventDate}T00:00:00`),
      eventTimeSlot: data.eventTimeSlot || undefined,
      eventType: data.eventType,
      guestCount: data.guestCount,
      eventAddress: data.eventAddress,
      venueType: data.venueType,
      powerAvailable: data.powerAvailable || undefined,
      notes: data.notes || undefined,
      source: "WEBSITE",
      stage: "NEW",
      signatureName: data.signatureName,
      signatureCode: code,
      signatureIp: ip,
      signedAt,
    },
  });

  await prisma.leadActivity.create({
    data: {
      leadId: lead.id,
      type: "note",
      content: "Submitted and signed rental agreement via website quote request form",
    },
  });

  // Notification email to the team inbox — never let a delivery failure
  // (e.g. SMTP not configured) block the customer's submission.
  try {
    await sendQuoteRequestNotification({
      leadId: lead.id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      eventDate: data.eventDate,
      eventTimeSlot: data.eventTimeSlot || undefined,
      eventType: data.eventType,
      guestCount: data.guestCount,
      eventAddress: data.eventAddress,
      venueType: data.venueType,
      powerAvailable: data.powerAvailable || undefined,
      notes: data.notes || undefined,
    });
  } catch (err) {
    console.error("Failed to send quote request notification email:", err);
  }

  return NextResponse.json(
    { ok: true, id: lead.id, signature: { name: data.signatureName, code, ip, signedAt } },
    { status: 201 }
  );
}
