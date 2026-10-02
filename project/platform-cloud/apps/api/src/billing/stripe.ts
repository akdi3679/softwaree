import { eq } from "drizzle-orm";
import Stripe from "stripe";
import { db } from "../db/client";
import { accounts } from "../db/schema/accounts";

const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY ?? "";
export const STRIPE_ENABLED = STRIPE_SECRET.length > 0;

export const stripe: Stripe | null = STRIPE_ENABLED
  ? new Stripe(STRIPE_SECRET, { apiVersion: "2024-06-20" })
  : null;

export const PLAN_TO_STRIPE_PRICE: Record<string, string> = {
  starter: process.env.STRIPE_PRICE_STARTER ?? "",
  team: process.env.STRIPE_PRICE_TEAM ?? "",
  enterprise: process.env.STRIPE_PRICE_ENTERPRISE ?? "",
};

export type PaidPlan = "starter" | "team" | "enterprise";

export async function createCheckoutSession(
  accountId: string,
  plan: PaidPlan,
  returnUrl: string,
): Promise<{ url: string; sessionId: string }> {
  if (!stripe) throw new Error("stripe not configured");
  const rows = await db.select().from(accounts).where(eq(accounts.id, accountId)).limit(1);
  const account = rows[0];
  if (!account) throw new Error("account not found");
  const price = PLAN_TO_STRIPE_PRICE[plan];
  if (!price) throw new Error(`price not configured for plan ${plan}`);
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price, quantity: 1 }],
    customer: account.stripeCustomerId ?? undefined,
    customer_email: account.stripeCustomerId ? undefined : account.email,
    success_url: `${returnUrl}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${returnUrl}?canceled=1`,
    metadata: { accountId, plan },
  });
  return { url: session.url ?? "", sessionId: session.id };
}

export async function cancelSubscription(accountId: string): Promise<void> {
  if (!stripe) throw new Error("stripe not configured");
  const rows = await db.select().from(accounts).where(eq(accounts.id, accountId)).limit(1);
  const account = rows[0];
  if (!account?.stripeSubscriptionId) throw new Error("no subscription");
  await stripe.subscriptions.cancel(account.stripeSubscriptionId);
}

export async function handleWebhook(
  rawBody: Buffer,
  signature: string,
): Promise<{ type: string; handled: boolean }> {
  if (!stripe) throw new Error("stripe not configured");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? "";
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (e) {
    throw new Error(`webhook signature invalid: ${(e as Error).message}`);
  }
  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const accountId = sub.metadata.accountId;
      if (accountId) {
        await db
          .update(accounts)
          .set({
            plan: sub.metadata.plan ?? "starter",
            stripeSubscriptionId: sub.id,
            planRenewsAt: new Date(sub.current_period_end * 1000),
          })
          .where(eq(accounts.id, accountId));
      }
      return { type: event.type, handled: true };
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const accountId = sub.metadata.accountId;
      if (accountId) {
        await db
          .update(accounts)
          .set({ plan: "local", planRenewsAt: null, stripeSubscriptionId: null })
          .where(eq(accounts.id, accountId));
      }
      return { type: event.type, handled: true };
    }
    default:
      return { type: event.type, handled: false };
  }
}
