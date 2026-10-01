# TASK ID: SUPPORT-001.1
# TITLE: Add ops support tool — log aggregator queries
# STATUS: pending
# DEPENDENCIES: MARKETPLACE-001.4
# ALLOWED FILES: platform-cloud/src/support/search.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Add a support endpoint that lets the ops team search logs for a project (with proper authorization).

## REQUIRED IMPLEMENTATION

Create `platform-cloud/src/support/search.ts`:

```typescript
import { Hono } from 'hono';
import { z } from 'zod';
import { db } from '../db';
import { auditEntries, sessions } from '../db/schema';
import { and, desc, eq, gte, like, lte, or } from 'drizzle-orm';

const SupportSearchSchema = z.object({
  account_id: z.string().optional(),
  project_id: z.string().optional(),
  action: z.string().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(1000).default(100),
  offset: z.coerce.number().int().min(0).default(0),
});

export const supportRoutes = new Hono()
  .get('/v1/support/audit/search', async (c) => {
    // The requester must be in the 'ops' group (tag:ops on the tailnet)
    // We check via the JWT claim or the request's auth token scope
    const role = c.get('role');
    if (role !== 'ops' && role !== 'admin') {
      return c.json({ error: 'not_authorized' }, 403);
    }
    const params = SupportSearchSchema.parse(c.req.query());
    const where: any[] = [];
    if (params.account_id) where.push(eq(auditEntries.accountId, params.account_id));
    if (params.action) where.push(like(auditEntries.action, `%${params.action}%`));
    if (params.from) where.push(gte(auditEntries.occurredAt, params.from));
    if (params.to) where.push(lte(auditEntries.occurredAt, params.to));
    const rows = await db.select().from(auditEntries)
      .where(where.length ? and(...where) : undefined)
      .orderBy(desc(auditEntries.occurredAt))
      .limit(params.limit)
      .offset(params.offset);
    return c.json({ entries: rows });
  })
  .get('/v1/support/sessions/:account_id', async (c) => {
    const role = c.get('role');
    if (role !== 'ops' && role !== 'admin') {
      return c.json({ error: 'not_authorized' }, 403);
    }
    const accountId = c.req.param('account_id');
    const rows = await db.select().from(sessions).where(eq(sessions.accountId, accountId));
    return c.json({ sessions: rows });
  });
```

Add to `package.json`:
```json
"scripts": {
  "support:dev": "tsx src/support/cli.ts"
}
```

Create `platform-cloud/src/support/cli.ts`:

```typescript
#!/usr/bin/env tsx
// Ops CLI: search audit log for an account
import { db } from '../db';
import { auditEntries } from '../db/schema';
import { eq, desc } from 'drizzle-orm';

const accountId = process.argv[2];
if (!accountId) {
  console.error('Usage: tsx src/support/cli.ts <account_id>');
  process.exit(1);
}

const rows = await db.select().from(auditEntries)
  .where(eq(auditEntries.accountId, accountId))
  .orderBy(desc(auditEntries.occurredAt))
  .limit(200);
console.table(rows);
process.exit(0);
```

## TESTS

```bash
cd platform-cloud
test -f src/support/search.ts || { echo "FAIL"; exit 1; }
test -f src/support/cli.ts || { echo "FAIL: no CLI"; exit 1; }
grep -q "support/audit/search" src/support/search.ts || { echo "FAIL: no route"; exit 1; }
pnpm typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
