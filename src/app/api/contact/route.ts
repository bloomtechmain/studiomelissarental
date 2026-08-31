import { NextRequest, NextResponse } from "next/server";
import { contactInputSchema } from "@/lib/validation";
import { prisma } from "@/lib/prisma";
import { sendContactMessageNotification } from "@/lib/email";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = contactInputSchema.safeParse(body);
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
      email: data.email,
      phone: data.phone || undefined,
      notes: data.message,
      source: "WEBSITE",
      stage: "NEW",
    },
  });

  await prisma.leadActivity.create({
    data: {
      leadId: lead.id,
      type: "note",
      content: "Submitted via website contact form",
    },
  });

  try {
    await sendContactMessageNotification({
      leadId: lead.id,
      name: data.name,
      email: data.email,
      phone: data.phone || undefined,
      message: data.message,
    });
  } catch (err) {
    console.error("Failed to send contact message notification email:", err);
  }

  return NextResponse.json({ ok: true, id: lead.id }, { status: 201 });
}
