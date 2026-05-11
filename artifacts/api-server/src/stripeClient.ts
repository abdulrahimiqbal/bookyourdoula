import Stripe from "stripe";

export function getStripeClient(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "STRIPE_SECRET_KEY environment variable is required. " +
        "Add it via the Secrets tab in the Replit sidebar."
    );
  }
  return new Stripe(key);
}

export function getStripeWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error(
      "STRIPE_WEBHOOK_SECRET environment variable is required. " +
        "Add it via the Secrets tab in the Replit sidebar."
    );
  }
  return secret;
}
