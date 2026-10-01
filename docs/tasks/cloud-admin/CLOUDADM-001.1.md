# TASK ID: CLOUDADM-001.1
# TITLE: Add Cloud admin panel — our ops team manages the platform
# STATUS: pending
# DEPENDENCIES: LOAD-001.2
# ALLOWED FILES: platform-cloud/src/admin/console.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
A web-based console for our ops team. Manage accounts, modules, plan overrides.

## REQUIRED IMPLEMENTATION

Create `platform-cloud/src/admin/console.ts`:

```typescript
import { Hono } from 'hono';
import { z } from 'zod';
import { db } from '../db';
import { accounts, modules, subscriptions, auditEntries } from '../db/schema';
import { eq, desc, count } from 'drizzle-orm';

function requireOps(c: any) {
  const role = c.get('role');
  if (role !== 'ops') return c.json({ error: 'not_authorized' }, 403);
}

export const adminConsoleRoutes = new Hono()
  .get('/v1/admin/accounts', async (c) => {
    const err = requireOps(c); if (err) return err;
    const limit = parseInt(c.req.query('limit') ?? '100', 10);
    const offset = parseInt(c.req.query('offset') ?? '0', 10);
    const rows = await db.select().from(accounts).orderBy(desc(accounts.createdAt)).limit(limit).offset(offset);
    return c.json({ accounts: rows });
  })
  .post('/v1/admin/accounts/:id/suspend', async (c) => {
    const err = requireOps(c); if (err) return err;
    const id = c.req.param('id');
    await db.update(accounts).set({ state: 'suspended' }).where(eq(accounts.id, id));
    return c.json({ suspended: true });
  })
  .post('/v1/admin/accounts/:id/restore', async (c) => {
    const err = requireOps(c); if (err) return err;
    const id = c.req.param('id');
    await db.update(accounts).set({ state: 'active' }).where(eq(accounts.id, id));
    return c.json({ restored: true });
  })
  .get('/v1/admin/stats', async (c) => {
    const err = requireOps(c); if (err) return err;
    const accountCount = await db.select({ count: count() }).from(accounts);
    const moduleCount = await db.select({ count: count() }).from(modules);
    return c.json({
      total_accounts: accountCount[0].count,
      total_modules: moduleCount[0].count,
      plan_distribution: await db.select({ plan: accounts.plan, count: count() }).from(accounts).groupBy(accounts.plan),
    });
  })
  .get('/v1/admin/audit', async (c) => {
    const err = requireOps(c); if (err) return err;
    const limit = parseInt(c.req.query('limit') ?? '100', 10);
    const rows = await db.select().from(auditEntries).orderBy(desc(auditEntries.occurredAt)).limit(limit);
    return c.json({ entries: rows });
  });
```

## TESTS

```bash
cd platform-cloud
test -f src/admin/console.ts || { echo "FAIL"; exit 1; }
grep -q "requireOps" src/admin/console.ts || { echo "FAIL"; exit 1; }
pnpm typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
