# TASK ID: CLOUD-009.5
# TITLE: Create audit service
# STATUS: pending
# DEPENDENCIES: CLOUD-009.4
# ALLOWED FILES: platform-cloud/apps/api/src/services/audit.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
Create the audit service — hash-chained platform audit log writer + reader.

## REQUIRED IMPLEMENTATION

Create `platform-cloud/apps/api/src/services/audit.ts`:

```typescript
import { desc, eq } from 'drizzle-orm';
import { db } from '../db/client';
import { auditEntries } from '../db/schema';
import { sha256Hex } from '../crypto/device-key';

const GENESIS_HASH = '0'.repeat(64);

export interface AppendAuditInput {
  category: 'auth' | 'device' | 'project' | 'billing' | 'security' | 'platform';
  action: string;
  actorUserId?: string;
  actorDeviceId?: string;
  actorIp?: string;
  targetType?: string;
  targetId?: string;
  projectId?: string;
  result: 'success' | 'failure' | 'denied';
  details?: Record<string, unknown>;
}

/**
 * Append a new audit entry. Hash-chained: each entry contains
 * the hash of the previous entry, and its own hash is computed
 * over (prevHash + body).
 */
export async function appendAudit(input: AppendAuditInput) {
  // Get the latest entry to chain from
  const latest = await db
    .select({ entryHash: auditEntries.entryHash })
    .from(auditEntries)
    .orderBy(desc(auditEntries.occurredAt))
    .limit(1);
  const prevHash = latest[0]?.entryHash ?? GENESIS_HASH;

  const occurredAt = new Date();
  const body = JSON.stringify({
    occurredAt: occurredAt.toISOString(),
    category: input.category,
    action: input.action,
    actorUserId: input.actorUserId,
    actorDeviceId: input.actorDeviceId,
    actorIp: input.actorIp,
    targetType: input.targetType,
    targetId: input.targetId,
    projectId: input.projectId,
    result: input.result,
    details: input.details ?? {},
  });
  const entryHash = sha256Hex(new TextEncoder().encode(prevHash + body));

  const [row] = await db
    .insert(auditEntries)
    .values({
      occurredAt,
      category: input.category,
      action: input.action,
      actorUserId: input.actorUserId,
      actorDeviceId: input.actorDeviceId,
      actorIp: input.actorIp,
      targetType: input.targetType,
      targetId: input.targetId,
      projectId: input.projectId,
      result: input.result,
      prevHash,
      entryHash,
      details: input.details ?? {},
    })
    .returning();

  return row;
}

export async function listAuditForProject(projectId: string, limit = 100) {
  return db
    .select()
    .from(auditEntries)
    .where(eq(auditEntries.projectId, projectId))
    .orderBy(desc(auditEntries.occurredAt))
    .limit(limit);
}
```

## TESTS

```bash
cd platform-cloud
test -f apps/api/src/services/audit.ts || { echo "FAIL"; exit 1; }
grep -q "appendAudit" apps/api/src/services/audit.ts || { echo "FAIL"; exit 1; }
grep -q "entryHash" apps/api/src/services/audit.ts || { echo "FAIL: no chain"; exit 1; }
pnpm --filter @cloud/api typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
