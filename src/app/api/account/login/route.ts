import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { customerLoginSchema } from "@/lib/validation";
import { findCustomerByEmail, createCustomerSession } from "@/lib/customerAuth";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = customerLoginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 400 });
  }

  const customer = await findCustomerByEmail(parsed.data.email);
  if (!customer || !customer.passwordHash) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  const ok = await bcrypt.compare(parsed.data.password, customer.passwordHash);
  if (!ok) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  await createCustomerSession({ id: customer.id, name: customer.name, email: customer.email! });
  return NextResponse.json({ ok: true });
}
