import Stripe from "stripe";

export async function changePlanWithProration(opts: {
  subscription_id: string;
  new_price_id: string;
  prorate: boolean;
}): Promise<Stripe.Subscription> {
  const key = process.env.STRIPE_SECRET_KEY ?? "";
  if (!key) throw new Error("stripe not configured");
  const stripe = new Stripe(key, { apiVersion: "2024-06-20" });
  const sub = await stripe.subscriptions.retrieve(opts.subscription_id);
  const firstItem = sub.items.data[0];
  if (!firstItem) throw new Error("subscription has no items");
  return await stripe.subscriptions.update(opts.subscription_id, {
    items: [{ id: firstItem.id, price: opts.new_price_id }],
    proration_behavior: opts.prorate ? "create_prorations" : "none",
  });
}
