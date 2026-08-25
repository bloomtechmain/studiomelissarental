import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

// Stripe signs the raw request body — req.text() (not req.json()) preserves
// exactly the bytes Stripe hashed, which a parsed-then-restringified body
// would not reliably match.
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Webhook not configured." }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    const checkoutSession = event.data.object as Stripe.Checkout.Session;
    await markPaymentCompleted(checkoutSession);
  }

  if (event.type === "checkout.session.expired" || event.type === "checkout.session.async_payment_failed") {
    const checkoutSession = event.data.object as Stripe.Checkout.Session;
    await prisma.stripePayment.updateMany({
      where: { stripeCheckoutSessionId: checkoutSession.id, status: "PENDING" },
      data: { status: event.type === "checkout.session.expired" ? "CANCELLED" : "FAILED" },
    });
  }

  return NextResponse.json({ received: true });
}

async function markPaymentCompleted(checkoutSession: Stripe.Checkout.Session) {
  const payment = await prisma.stripePayment.findUnique({
    where: { stripeCheckoutSessionId: checkoutSession.id },
  });
  // Already-processed sessions and links created before this deploy (no
  // matching row) are both no-ops rather than errors — Stripe retries
  // webhooks, so this handler must be safe to run more than once.
  if (!payment || payment.status === "COMPLETED") return;

  const paymentIntentId =
    typeof checkoutSession.payment_intent === "string"
      ? checkoutSession.payment_intent
      : checkoutSession.payment_intent?.id ?? null;

  await prisma.$transaction(async (tx) => {
    await tx.stripePayment.update({
      where: { id: payment.id },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        stripePaymentIntentId: paymentIntentId,
      },
    });
    const booking = await tx.booking.findUniqueOrThrow({ where: { id: payment.bookingId } });
    await tx.booking.update({
      where: { id: payment.bookingId },
      data: {
        amountPaid: Number(booking.amountPaid) + Number(payment.amount),
        paymentMethod: booking.paymentMethod ?? "CARD",
      },
    });
  });

  await logAudit({
    entity: "Booking",
    entityId: payment.bookingId,
    action: "stripe_payment_completed",
    detail: `Stripe payment of $${Number(payment.amount).toFixed(2)} completed`,
  });
}
