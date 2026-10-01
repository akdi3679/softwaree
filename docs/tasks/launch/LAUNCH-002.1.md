# TASK ID: LAUNCH-002.1
# TITLE: Add Stripe webhook signature verification + idempotency
# STATUS: pending
# DEPENDENCIES: LAUNCH-001.2
# ALLOWED FILES: platform-cloud/src/billing/stripe_webhook.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Webhook is real-money — verify Stripe signature, dedupe by event id, no double-charge.

## REQUIRED IMPLEMENTATION

Create `platform-cloud/src/billing/stripe_webhook.ts`:

```typescript
import Stripe from 'stripe';
import { db } from '../db';
import { Hono } from 'hono';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' });
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!;
const app = new Hono();

app.post('/v1/billing/stripe/webhook', async (c) => {
  const sig = c.req.header('stripe-signature');
  if (!sig) return c.json({ error: { category: 'forbidden', message: 'missing signature' } }, 400);
  const raw = await c.req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, WEBHOOK_SECRET);
  } catch (e: any) {
    return c.json({ error: { category: 'forbidden', message: `signature invalid: ${e.message}` } }, 400);
  }
  // Idempotency: have we already processed this event?
  const seen = await db('stripe_events').where({ id: event.id }).first();
  if (seen) return c.json({ received: true, deduped: true });
  await db('stripe_events').insert({ id: event.id, type: event.type, created_at: new Date().toISOString() });
  // Dispatch
  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription;
      await db('subscriptions').where({ stripe_subscription_id: sub.id }).update({
        plan: planFromPrice(sub.items.data[0].price.id),
        status: sub.status,
        current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
        cancel_at_period_end: sub.cancel_at_period_end,
      });
      break;
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      await db('subscriptions').where({ stripe_subscription_id: sub.id }).update({ status: 'canceled' });
      break;
    }
    case 'invoice.payment_succeeded': {
      const inv = event.data.object as Stripe.Invoice;
      // Notify customer via email
      // (handled in CLOUD-EMAIL)
      break;
    }
    case 'invoice.payment_failed': {
      const inv = event.data.object as Stripe.Invoice;
      // Suspend account after grace period
      break;
    }
  }
  return c.json({ received: true });
});

function planFromPrice(priceId: string): string {
  const map: Record<string, string> = {
    [process.env.STRIPE_PRICE_STARTER!]: 'starter',
    [process.env.STRIPE_PRICE_TEAM!]: 'team',
    [process.env.STRIPE_PRICE_ENTERPRISE!]: 'enterprise',
  };
  return map[priceId] ?? 'starter';
}
```

Add migration `add_stripe_events.sql`:

```sql
CREATE TABLE IF NOT EXISTS stripe_events (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

## TESTS

```bash
cd platform-cloud
test -f src/billing/stripe_webhook.ts || { echo "FAIL"; exit 1; }
grep -q "constructEvent" src/billing/stripe_webhook.ts || { echo "FAIL"; exit 1; }
echo "OK"
```
