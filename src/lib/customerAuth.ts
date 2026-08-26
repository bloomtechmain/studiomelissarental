import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

// Deliberately separate from src/lib/auth.ts (staff sessions): its own
// cookie name and its own signing secret, so a leaked key on one side can't
// forge a session on the other.
const COOKIE_NAME = "smr_customer_session";
const secret = new TextEncoder().encode(
  process.env.CUSTOMER_SESSION_SECRET ?? "dev-only-insecure-customer-secret"
);

export type CustomerSessionUser = { id: string; name: string; email: string };

export async function createCustomerSession(user: CustomerSessionUser) {
  const token = await new SignJWT({ user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);

  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function destroyCustomerSession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function getCustomerSession(): Promise<CustomerSessionUser | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return (payload as { user: CustomerSessionUser }).user;
  } catch {
    return null;
  }
}

export async function requireCustomerSession(): Promise<CustomerSessionUser> {
  const session = await getCustomerSession();
  if (!session) throw new Error("UNAUTHENTICATED");
  return session;
}

export async function findCustomerByEmail(email: string) {
  return prisma.customer.findUnique({ where: { email: email.trim().toLowerCase() } });
}
