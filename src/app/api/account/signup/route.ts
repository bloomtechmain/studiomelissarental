import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { customerSignupSchema } from "@/lib/validation";
import { prisma } from "@/lib/prisma";
import { createCustomerSession } from "@/lib/customerAuth";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = customerSignupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 }
    );
  }

  const { name, email, phone, password } = parsed.data;
  const passwordHash = await bcrypt.hash(password, 10);

  const existing = await prisma.customer.findUnique({ where: { email } });

  let customer;
  if (existing) {
    // A staff member may have already created this customer from a past
    // booking/lead (no passwordHash yet) — claim that record instead of
    // creating a duplicate, so their existing rental history shows up
    // immediately once they log in.
    if (existing.passwordHash) {
      return NextResponse.json(
        { error: "An account with this email already exists. Try logging in instead." },
        { status: 409 }
      );
    }
    customer = await prisma.customer.update({
      where: { id: existing.id },
      data: {
        passwordHash,
        name: existing.name || name,
        phone: existing.phone || phone || undefined,
      },
    });
  } else {
    customer = await prisma.customer.create({
      data: { name, email, phone: phone || undefined, passwordHash },
    });
  }

  await createCustomerSession({ id: customer.id, name: customer.name, email: customer.email! });
  return NextResponse.json({ ok: true });
}
