# TASK ID: PORTAL-001.1
# TITLE: Add customer portal (web app for billing, team management)
# STATUS: pending
# DEPENDENCIES: CLOUDADM-001.2
# ALLOWED FILES: platform-cloud/src/portal/index.ts, platform-cloud/src/portal/billing.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
Web portal where the customer manages their account: billing, team, devices.

## REQUIRED IMPLEMENTATION

Create `platform-cloud/src/portal/index.ts`:

```typescript
import { Hono } from 'hono';
import { db } from '../db';
import { accounts, users, devices, subscriptions, plans } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import { stripe } from '../billing/stripe';

export const portalRoutes = new Hono()
  .get('/v1/portal/account', async (c) => {
    const accountId = c.get('accountId');
    if (!accountId) return c.json({ error: 'unauthorized' }, 401);
    const account = await db.select().from(accounts).where(eq(accounts.id, accountId)).limit(1);
    if (account.length === 0) return c.json({ error: 'not_found' }, 404);
    return c.json(account[0]);
  })
  .get('/v1/portal/team', async (c) => {
    const accountId = c.get('accountId');
    if (!accountId) return c.json({ error: 'unauthorized' }, 401);
    const team = await db.select().from(users).where(eq(users.accountId, accountId));
    return c.json({ team });
  })
  .get('/v1/portal/devices', async (c) => {
    const accountId = c.get('accountId');
    if (!accountId) return c.json({ error: 'unauthorized' }, 401);
    const devs = await db.select().from(devices).where(eq(devices.accountId, accountId));
    return c.json({ devices: devs });
  })
  .get('/v1/portal/invoices', async (c) => {
    const accountId = c.get('accountId');
    if (!accountId) return c.json({ error: 'unauthorized' }, 401);
    const account = await db.select().from(accounts).where(eq(accounts.id, accountId)).limit(1);
    if (account.length === 0 || !account[0].stripeCustomerId) return c.json({ invoices: [] });
    const invoices = await stripe.invoices.list({ customer: account[0].stripeCustomerId!, limit: 24 });
    return c.json({ invoices: invoices.data });
  })
  .get('/v1/portal/subscription', async (c) => {
    const accountId = c.get('accountId');
    if (!accountId) return c.json({ error: 'unauthorized' }, 401);
    const sub = await db.select().from(subscriptions).where(eq(subscriptions.accountId, accountId)).limit(1);
    if (sub.length === 0) return c.json({ subscription: null });
    return c.json({ subscription: sub[0] });
  });
```

## TESTS

```bash
cd platform-cloud
test -f src/portal/index.ts || { echo "FAIL"; exit 1; }
grep -q "v1/portal" src/portal/index.ts || { echo "FAIL"; exit 1; }
pnpm typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
