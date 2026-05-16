"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getAppUrl, getPriceId, getStripeClient } from "@/lib/stripe";
import { toPublicError } from "@/lib/errors";
import { requireWorkspacePermission } from "@/server/rbac";

const checkoutSchema = z.object({
  plan: z.enum(["STARTER", "PRO", "CABINET"]),
});

export async function createCheckoutSessionAction(formData: FormData) {
  const workspace = await requireWorkspacePermission("manageBilling");
  let target = "/app/billing";
  try {
    const { plan } = checkoutSchema.parse(Object.fromEntries(formData));
    const stripe = getStripeClient();
    const subscription = await prisma.subscription.upsert({
      where: { userId: workspace.workspaceUserId },
      update: {},
      create: { userId: workspace.workspaceUserId, plan: "FREE", status: "active" },
    });
    let customerId = subscription.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: workspace.actorEmail,
        name: workspace.actorName ?? undefined,
        metadata: { userId: workspace.workspaceUserId },
      });
      customerId = customer.id;
      await prisma.subscription.update({
        where: { userId: workspace.workspaceUserId },
        data: { stripeCustomerId: customerId },
      });
    }
    const appUrl = getAppUrl();
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: getPriceId(plan), quantity: 1 }],
      success_url: `${appUrl}/app/billing?success=Abonnement%20mis%20%C3%A0%20jour.`,
      cancel_url: `${appUrl}/app/billing?error=Paiement%20annul%C3%A9.`,
      metadata: {
        userId: workspace.workspaceUserId,
        plan,
      },
      subscription_data: {
        metadata: {
          userId: workspace.workspaceUserId,
          plan,
        },
      },
    });
    target = session.url ?? "/app/billing?error=Session%20Stripe%20introuvable.";
  } catch (error) {
    target = `/app/billing?error=${encodeURIComponent(toPublicError(error))}`;
  }
  redirect(target);
}

export async function createBillingPortalSessionAction() {
  const workspace = await requireWorkspacePermission("manageBilling");
  let target = "/app/billing";
  try {
    const stripe = getStripeClient();
    const subscription = await prisma.subscription.findUnique({ where: { userId: workspace.workspaceUserId } });
    if (!subscription?.stripeCustomerId) throw new Error("Aucun client Stripe associé.");
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${getAppUrl()}/app/billing`,
    });
    target = session.url;
  } catch (error) {
    target = `/app/billing?error=${encodeURIComponent(toPublicError(error))}`;
  }
  redirect(target);
}
