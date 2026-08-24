import { NextRequest, NextResponse } from "next/server";
import { leadInputSchema } from "@/lib/validation";
import { prisma } from "@/lib/prisma";
import { generateSignatureCode } from "@/lib/signatureEncryption";
import { saveSignatureImage } from "@/lib/uploads";
import { readPngDimensions } from "@/lib/png";

const SIGNATURE_WIDTH = 772;
const SIGNATURE_HEIGHT = 229;
const SIGNATURE_MAX_BYTES = 500 * 1024;

// Same extraction used by /api/bookings — Cloudflare/nginx sit in front of
// this app, so req.ip isn't available; the real client address is forwarded.
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

  const ip = clientIp(req);
  const signedAt = new Date();
  const { code, seed } = generateSignatureCode({
    name: data.signatureName,
    contact: data.email || data.phone || "",
    ip,
    timestamp: signedAt,
  });
  const { url: signatureImageUrl } = await saveSignatureImage(seed, signatureBuffer);

  const lead = await prisma.lead.create({
    data: {
      name: data.name,
      email: data.email || undefined,
      phone: data.phone || undefined,
      org: data.org || undefined,
      eventDate: data.eventDate ? new Date(`${data.eventDate}T00:00:00`) : undefined,
      eventTimeSlot: data.eventTimeSlot || undefined,
      eventName: data.eventName || undefined,
      roomSize: data.roomSize || undefined,
      guestCount: data.guestCount || undefined,
      recommendedTier: data.recommendedTier || undefined,
      eventAddress: data.eventAddress || undefined,
      notes: data.notes || undefined,
      source: "WEBSITE",
      stage: "NEW",
      signatureName: data.signatureName,
      signatureCode: code,
      signatureIp: ip,
      signatureImageUrl,
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

  return NextResponse.json(
    { ok: true, signature: { name: data.signatureName, code, ip, signedAt } },
    { status: 201 }
  );
}
