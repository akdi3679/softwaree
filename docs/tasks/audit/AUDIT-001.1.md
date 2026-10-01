# TASK ID: AUDIT-001.1
# TITLE: Add tamper-evident audit chain in Cloud
# STATUS: pending
# DEPENDENCIES: SECURITY-001.6
# ALLOWED FILES: platform-cloud/src/audit/chain.ts, platform-cloud/src/audit/middleware.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
Cloud-side audit log with hash chain. Records every state-changing action.

## REQUIRED IMPLEMENTATION

Create `platform-cloud/src/audit/chain.ts`:

```typescript
import { createHash } from 'node:crypto';
import { db } from '../db';
import { auditEntries } from '../db/schema';

export const GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

export interface AuditInput {
  accountId: string | null;
  deviceId: string | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
  result: 'success' | 'failure';
  correlationId: string | null;
  details?: Record<string, unknown>;
}

export async function appendAudit(input: AuditInput): Promise<number> {
  const prevRow = await db
    .select({ hash: auditEntries.entryHash })
    .from(auditEntries)
    .orderBy(sql`${auditEntries.id} DESC`)
    .limit(1);
  const prevHash = prevRow[0]?.hash ?? GENESIS_HASH;

  const now = new Date().toISOString();
  const hash = createHash('sha256')
    .update(prevHash)
    .update(now)
    .update(input.action)
    .update(input.accountId ?? '')
    .update(input.deviceId ?? '')
    .update(input.targetType ?? '')
    .update(input.targetId ?? '')
    .update(input.result)
    .update(JSON.stringify(input.details ?? {}))
    .digest('hex');

  const inserted = await db
    .insert(auditEntries)
    .values({
      occurredAt: now,
      accountId: input.accountId,
      deviceId: input.deviceId,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId,
      result: input.result,
      details: input.details ? JSON.stringify(input.details) : null,
      prevHash,
      entryHash: hash,
      correlationId: input.correlationId,
    })
    .returning({ id: auditEntries.id });

  return inserted[0].id;
}

export async function verifyChain(): Promise<{ validCount: number; totalCount: number; brokenAt: number | null }> {
  const rows = await db
    .select({
      id: auditEntries.id,
      prevHash: auditEntries.prevHash,
      entryHash: auditEntries.entryHash,
      action: auditEntries.action,
      occurredAt: auditEntries.occurredAt,
      accountId: auditEntries.accountId,
      deviceId: auditEntries.deviceId,
      targetType: auditEntries.targetType,
      targetId: auditEntries.targetId,
      result: auditEntries.result,
      details: auditEntries.details,
    })
    .from(auditEntries)
    .orderBy(auditEntries.id);

  let prev = GENESIS_HASH;
  let valid = 0;
  for (const r of rows) {
    if (r.prevHash !== prev) {
      return { validCount: valid, totalCount: rows.length, brokenAt: r.id };
    }
    valid++;
    prev = r.entryHash;
  }
  return { validCount: valid, totalCount: rows.length, brokenAt: null };
}
```

Add to `package.json`:
```json
"dependencies": {
  "drizzle-orm": "*"
}
```

Create `platform-cloud/src/audit/middleware.ts`:

```typescript
import type { Context, Next } from 'hono';
import { appendAudit } from './chain';

export async function auditMiddleware(c: Context, next: Next) {
  const start = Date.now();
  await next();
  const elapsed = Date.now() - start;
  const accountId = c.get('accountId');
  const deviceId = c.get('deviceId');
  const correlationId = c.get('correlationId');
  // Only audit state-changing methods
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(c.req.method)) return;
  // Skip auth endpoints (those are audited in the auth service itself)
  if (c.req.path.startsWith('/v1/accounts/sessions')) return;
  if (c.req.path === '/health' || c.req.path === '/metrics') return;
  await appendAudit({
    accountId: accountId ?? null,
    deviceId: deviceId ?? null,
    action: `${c.req.method} ${c.req.path}`,
    targetType: null,
    targetId: null,
    result: c.res.status < 400 ? 'success' : 'failure',
    correlationId: correlationId ?? null,
    details: { elapsedMs: elapsed },
  });
}
```

Add SQL to migration `0002_audit.sql`:

```sql
CREATE TABLE IF NOT EXISTS audit_entries (
  id SERIAL PRIMARY KEY,
  occurred_at TIMESTAMPTZ NOT NULL,
  account_id UUID,
  device_id UUID,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  result TEXT NOT NULL,
  details TEXT,
  prev_hash TEXT NOT NULL,
  entry_hash TEXT NOT NULL,
  correlation_id TEXT
);
CREATE INDEX IF NOT EXISTS idx_audit_occurred ON audit_entries (occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_entries (action);
```

## TESTS

```bash
cd platform-cloud
test -f src/audit/chain.ts || { echo "FAIL"; exit 1; }
test -f src/audit/middleware.ts || { echo "FAIL: no middleware"; exit 1; }
grep -q "verifyChain" src/audit/chain.ts || { echo "FAIL: no verify"; exit 1; }
pnpm typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
