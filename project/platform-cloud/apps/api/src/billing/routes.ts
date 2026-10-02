import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { db } from "../db/client";
import { accounts } from "../db/schema/accounts";
import {
  cancelSubscription,
  createCheckoutSession,
  handleWebhook,
  stripe,
} from "./stripe";

const CheckoutSchema = z.object({
  plan: z.enum(["starter", "team", "enterprise"]),
  returnUrl: z.string().url(),
});

export const billingRoutes = new Hono()
  .post("/v1/billing/checkout", async (c) => {
    const accountId = (c.get as (k: string) => unknown)("accountId");
    if (typeof accountId !== "string") return c.json({ error: "unauthorized" }, 401);
    const body = CheckoutSchema.parse(await c.req.json());
    const result = await createCheckoutSession(accountId, body.plan, body.returnUrl);
    return c.json(result);
  })
  .post("/v1/billing/cancel", async (c) => {
    const accountId = (c.get as (k: string) => unknown)("accountId");
    if (typeof accountId !== "string") return c.json({ error: "unauthorized" }, 401);
    await cancelSubscription(accountId);
    return c.json({ canceled: true });
  })
  .post("/v1/billing/webhook", async (c) => {
    const sig = c.req.header("stripe-signature") ?? "";
    const rawBody = Buffer.from(await c.req.arrayBuffer());
    const result = await handleWebhook(rawBody, sig);
    return c.json(result);
  })
  .post("/v1/billing/portal", async (c) => {
    const accountId = (c.get as (k: string) => unknown)("accountId");
    if (typeof accountId !== "string") return c.json({ error: "unauthorized" }, 401);
    if (!stripe) return c.json({ error: "stripe_disabled" }, 503);
    const rows = await db.select().from(accounts).where(eq(accounts.id, accountId)).limit(1);
    const account = rows[0];
    if (!account?.stripeCustomerId) return c.json({ error: "no_stripe_customer" }, 400);
    const session = await stripe.billingPortal.sessions.create({
      customer: account.stripeCustomerId,
      return_url: c.req.header("referer") ?? "https://product.local",
    });
    return c.json({ url: session.url });
  });
