import { NextRequest, NextResponse } from "next/server";
import { leadInputSchema } from "@/lib/validation";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
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

  const lead = await prisma.lead.create({
    data: {
      name: data.name,
      email: data.email || undefined,
      phone: data.phone || undefined,
      org: data.org || undefined,
      eventDate: data.eventDate ? new Date(`${data.eventDate}T00:00:00`) : undefined,
      roomSize: data.roomSize || undefined,
      guestCount: data.guestCount || undefined,
      recommendedTier: data.recommendedTier || undefined,
      eventAddress: data.eventAddress || undefined,
      notes: data.notes || undefined,
      source: "WEBSITE",
      stage: "NEW",
    },
  });

  await prisma.leadActivity.create({
    data: { leadId: lead.id, type: "note", content: "Submitted via website quote request form" },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
