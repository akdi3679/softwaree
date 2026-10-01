# TASK ID: BILLING-001.1
# TITLE: Add Stripe integration for subscriptions
# STATUS: pending
# DEPENDENCIES: SUPPORT-001.4
# ALLOWED FILES: platform-cloud/src/billing/stripe.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
Integrate Stripe for plan subscriptions. Webhooks to update account.plan.

## REQUIRED IMPLEMENTATION

Add to `package.json`:
```json
"dependencies": {
  "stripe": "^16.12.0"
}
```

Create `platform-cloud/src/billing/stripe.ts`:

```typescript
import Stripe from 'stripe';
import { db } from '../db';
import { accounts, subscriptions } from '../db/schema';
import { eq } from 'drizzle-orm';

const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY ?? '';
export const stripe = new Stripe(STRIPE_SECRET, { apiVersion: '2024-06-20' });

export const PLAN_TO_STRIPE_PRICE: Record<string, string> = {
  starter: process.env.STRIPE_PRICE_STARTER ?? '',
  team: process.env.STRIPE_PRICE_TEAM ?? '',
  enterprise: process.env.STRIPE_PRICE_ENTERPRISE ?? '',
};

export async function createCheckoutSession(accountId: string, plan: 'starter' | 'team' | 'enterprise', returnUrl: string) {
  const account = await db.select().from(accounts).where(eq(accounts.id, accountId)).limit(1);
  if (account.length === 0) throw new Error('account not found');
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: PLAN_TO_STRIPE_PRICE[plan], quantity: 1 }],
    customer: account[0].stripeCustomerId ?? undefined,
    customer_email: account[0].stripeCustomerId ? undefined : account[0].email,
    success_url: `${returnUrl}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${returnUrl}?canceled=1`,
    metadata: { accountId, plan },
  });
  return { url: session.url!, sessionId: session.id };
}

export async function cancelSubscription(accountId: string) {
  const sub = await db.select().from(subscriptions).where(eq(subscriptions.accountId, accountId)).limit(1);
  if (sub.length === 0) throw new Error('no subscription');
  await stripe.subscriptions.cancel(sub[0].stripeSubscriptionId);
}

export async function handleWebhook(rawBody: Buffer, signature: string): Promise<{ type: string; handled: boolean }> {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? '';
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (e: any) {
    throw new Error(`webhook signature invalid: ${e.message}`);
  }
  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription;
      const accountId = sub.metadata.accountId;
      await db.update(accounts).set({
        plan: (sub.metadata.plan ?? 'starter') as any,
        stripeSubscriptionId: sub.id,
        planRenewsAt: new Date(sub.current_period_end * 1000).toISOString(),
      }).where(eq(accounts.id, accountId));
      return { type: event.type, handled: true };
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      const accountId = sub.metadata.accountId;
      await db.update(accounts).set({
        plan: 'local',
        planRenewsAt: null,
      }).where(eq(accounts.id, accountId));
      return { type: event.type, handled: true };
    }
    default:
      return { type: event.type, handled: false };
  }
}
```

## TESTS

```bash
cd platform-cloud
test -f src/billing/stripe.ts || { echo "FAIL"; exit 1; }
grep -q "createCheckoutSession" src/billing/stripe.ts || { echo "FAIL"; exit 1; }
pnpm typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
