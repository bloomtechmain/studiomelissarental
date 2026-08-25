import Stripe from "stripe";

// Lazily constructed so a missing key fails loudly at the point of use
// (creating a checkout session, verifying a webhook) rather than crashing
// every route on boot — most of the app has nothing to do with payments.
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not set — add your sandbox secret key to .env.");
  }
  _stripe = new Stripe(key);
  return _stripe;
}
