# TASK ID: CLOUD-017.1
# TITLE: Add Cloud: per-account storage quota
# STATUS: pending
# DEPENDENCIES: SYNC-008.2
# ALLOWED FILES: platform-cloud/src/quotas/storage.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Plan limits: 5 GB / 50 GB / 500 GB / unlimited. Reject uploads over limit.

## REQUIRED IMPLEMENTATION

Create `platform-cloud/src/quotas/storage.ts`:

```typescript
import { db } from '../db';

const PLAN_LIMITS_BYTES: Record<string, number> = {
  local: 0,
  starter: 5 * 1024 * 1024 * 1024,
  team: 50 * 1024 * 1024 * 1024,
  enterprise: 5 * 1024 * 1024 * 1024 * 1024, // 5 TB
};

export async function currentUsage(account_id: string): Promise<number> {
  const r = await db('backups')
    .join('projects', 'projects.id', 'backups.project_id')
    .where('projects.account_id', account_id)
    .sum('backups.encrypted_size as bytes')
    .first();
  return Number(r?.bytes ?? 0);
}

export async function canUpload(account_id: string, plan: string, size: number): Promise<{ ok: boolean; reason?: string }> {
  const limit = PLAN_LIMITS_BYTES[plan] ?? 0;
  if (limit === 0) return { ok: false, reason: 'plan does not allow backups' };
  const cur = await currentUsage(account_id);
  if (cur + size > limit) {
    return { ok: false, reason: `would exceed plan storage limit (${(limit / 1024 / 1024 / 1024).toFixed(0)} GB)` };
  }
  return { ok: true };
}
```

## TESTS

```bash
cd platform-cloud
test -f src/quotas/storage.ts || { echo "FAIL"; exit 1; }
grep -q "canUpload" src/quotas/storage.ts || { echo "FAIL"; exit 1; }
echo "OK"
```
