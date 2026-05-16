import Stripe from "stripe";
import { BillingError } from "@/lib/errors";

export function getStripeClient() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new BillingError("Stripe n'est pas configuré en local.");
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

export function getPriceId(plan: "STARTER" | "PRO" | "CABINET", period: "monthly" | "yearly" = "monthly") {
  const envKey = `STRIPE_PRICE_${plan}_${period.toUpperCase()}`;
  const priceId = process.env[envKey];
  if (!priceId) throw new BillingError("Stripe n'est pas configuré en local.");
  return priceId;
}

export function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}
