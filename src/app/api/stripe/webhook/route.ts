import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStripeClient } from "@/lib/stripe";
import { flagSubscriptionOverLimit } from "@/server/billing";

function mapPriceToPlan(priceId?: string | null) {
  if (!priceId) return null;
  const e = process.env;
  if (priceId === e.STRIPE_PRICE_STARTER_MONTHLY || priceId === e.STRIPE_PRICE_STARTER_YEARLY) return "STARTER";
  if (priceId === e.STRIPE_PRICE_PRO_MONTHLY || priceId === e.STRIPE_PRICE_PRO_YEARLY) return "PRO";
  if (priceId === e.STRIPE_PRICE_CABINET_MONTHLY || priceId === e.STRIPE_PRICE_CABINET_YEARLY) return "CABINET";
  return null;
}

export async function POST(request: Request) {
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Stripe n'est pas configuré en local." }, { status: 400 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Signature Stripe manquante." }, { status: 400 });
  }

  const body = await request.text();
  const stripe = getStripeClient();
  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return NextResponse.json({ error: "Signature Stripe invalide." }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const userId = session.metadata?.userId;
    const plan = session.metadata?.plan;
    if (userId && plan && ["STARTER", "PRO", "CABINET"].includes(plan)) {
      await prisma.subscription.upsert({
        where: { userId },
        update: {
          stripeCustomerId: typeof session.customer === "string" ? session.customer : null,
          stripeSubscriptionId: typeof session.subscription === "string" ? session.subscription : null,
          plan: plan as "STARTER" | "PRO" | "CABINET",
          status: "active",
        },
        create: {
          userId,
          stripeCustomerId: typeof session.customer === "string" ? session.customer : null,
          stripeSubscriptionId: typeof session.subscription === "string" ? session.subscription : null,
          plan: plan as "STARTER" | "PRO" | "CABINET",
          status: "active",
        },
      });
      await flagSubscriptionOverLimit(userId);
    }
  }

  if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
    const subscription = event.data.object;
    const userId = subscription.metadata?.userId;
    const item = subscription.items.data[0];
    const plan = mapPriceToPlan(item?.price.id) ?? (subscription.metadata?.plan as string | undefined);
    if (userId && plan && ["FREE", "STARTER", "PRO", "CABINET"].includes(plan)) {
      await prisma.subscription.upsert({
        where: { userId },
        update: {
          stripeCustomerId: typeof subscription.customer === "string" ? subscription.customer : null,
          stripeSubscriptionId: subscription.id,
          plan: event.type === "customer.subscription.deleted" ? "FREE" : (plan as "STARTER" | "PRO" | "CABINET"),
          status: subscription.status,
          currentPeriodEnd: subscription.items.data[0]?.current_period_end
            ? new Date(subscription.items.data[0].current_period_end * 1000)
            : null,
        },
        create: {
          userId,
          stripeCustomerId: typeof subscription.customer === "string" ? subscription.customer : null,
          stripeSubscriptionId: subscription.id,
          plan: event.type === "customer.subscription.deleted" ? "FREE" : (plan as "STARTER" | "PRO" | "CABINET"),
          status: subscription.status,
          currentPeriodEnd: subscription.items.data[0]?.current_period_end
            ? new Date(subscription.items.data[0].current_period_end * 1000)
            : null,
        },
      });
      await flagSubscriptionOverLimit(userId);
    }
  }

  return NextResponse.json({ received: true });
}
