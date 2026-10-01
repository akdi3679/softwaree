# TASK ID: BILLING-001.2
# TITLE: Add Cloud billing routes (checkout, webhook, portal)
# STATUS: pending
# DEPENDENCIES: BILLING-001.1
# ALLOWED FILES: platform-cloud/src/billing/routes.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Expose billing endpoints: create checkout, webhook receiver, customer portal.

## REQUIRED IMPLEMENTATION

Create `platform-cloud/src/billing/routes.ts`:

```typescript
import { Hono } from 'hono';
import { z } from 'zod';
import { createCheckoutSession, cancelSubscription, handleWebhook } from './stripe';

export const billingRoutes = new Hono()
  .post('/v1/billing/checkout', async (c) => {
    const accountId = c.get('accountId');
    if (!accountId) return c.json({ error: 'unauthorized' }, 401);
    const body = z.object({ plan: z.enum(['starter', 'team', 'enterprise']), returnUrl: z.string().url() }).parse(await c.req.json());
    const result = await createCheckoutSession(accountId, body.plan, body.returnUrl);
    return c.json(result);
  })
  .post('/v1/billing/cancel', async (c) => {
    const accountId = c.get('accountId');
    if (!accountId) return c.json({ error: 'unauthorized' }, 401);
    await cancelSubscription(accountId);
    return c.json({ canceled: true });
  })
  .post('/v1/billing/webhook', async (c) => {
    const sig = c.req.header('stripe-signature') ?? '';
    const rawBody = Buffer.from(await c.req.arrayBuffer());
    const result = await handleWebhook(rawBody, sig);
    return c.json(result);
  })
  .post('/v1/billing/portal', async (c) => {
    // Redirects to Stripe customer portal
    const accountId = c.get('accountId');
    if (!accountId) return c.json({ error: 'unauthorized' }, 401);
    const { stripe } = await import('./stripe');
    const { db } = await import('../db');
    const { accounts } = await import('../db/schema');
    const { eq } = await import('drizzle-orm');
    const account = await db.select().from(accounts).where(eq(accounts.id, accountId)).limit(1);
    if (account.length === 0 || !account[0].stripeCustomerId) return c.json({ error: 'no_stripe_customer' }, 400);
    const session = await stripe.billingPortal.sessions.create({
      customer: account[0].stripeCustomerId,
      return_url: c.req.header('referer') ?? 'https://product.local',
    });
    return c.json({ url: session.url });
  });
```

## TESTS

```bash
cd platform-cloud
test -f src/billing/routes.ts || { echo "FAIL"; exit 1; }
grep -q "checkout" src/billing/routes.ts || { echo "FAIL"; exit 1; }
echo "OK"
```
