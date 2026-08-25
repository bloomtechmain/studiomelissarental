import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "smr_session";
const secret = new TextEncoder().encode(process.env.SESSION_SECRET ?? "dev-only-insecure-secret");

const CUSTOMER_COOKIE_NAME = "smr_customer_session";
const customerSecret = new TextEncoder().encode(
  process.env.CUSTOMER_SESSION_SECRET ?? "dev-only-insecure-customer-secret"
);

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/account")) {
    if (pathname === "/account/login" || pathname === "/account/signup") return NextResponse.next();

    const token = req.cookies.get(CUSTOMER_COOKIE_NAME)?.value;
    if (!token) return NextResponse.redirect(new URL("/account/login", req.url));

    try {
      await jwtVerify(token, customerSecret);
      return NextResponse.next();
    } catch {
      return NextResponse.redirect(new URL("/account/login", req.url));
    }
  }

  if (pathname === "/admin/login") return NextResponse.next();

  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return NextResponse.redirect(new URL("/admin/login", req.url));

  try {
    await jwtVerify(token, secret);
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }
}

export const config = {
  matcher: ["/admin/:path*", "/account/:path*"],
};
