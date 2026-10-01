# TASK ID: CLOUD-021.1
# TITLE: Add Cloud: scheduled background jobs (Drizzle-backed)
# STATUS: pending
# DEPENDENCIES: SYNC-009.2
# ALLOWED FILES: platform-cloud/src/jobs/scheduler.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Periodic jobs: rotate logs, check disk, etc.

## REQUIRED IMPLEMENTATION

Create `platform-cloud/src/jobs/scheduler.ts`:

```typescript
import { db } from '../db';
import { logger } from '../log';

const JOBS: { name: string; interval_s: number; run: () => Promise<void> }[] = [
  { name: 'expire-sessions', interval_s: 300, run: expireSessions },
  { name: 'cleanup-pending-deletions', interval_s: 3600, run: cleanupPendingDeletions },
  { name: 'collect-metrics', interval_s: 60, run: collectMetrics },
  { name: 'purge-old-audit', interval_s: 86400, run: purgeOldAudit },
];

export function startScheduler() {
  for (const job of JOBS) {
    setInterval(async () => {
      try { await job.run(); }
      catch (e: any) { logger.error(`job ${job.name} failed`, { error: e.message }); }
    }, job.interval_s * 1000);
  }
}

async function expireSessions() {
  await db('account_sessions')
    .where('expires_at', '<', new Date().toISOString())
    .andWhere({ state: 'active' })
    .update({ state: 'expired' });
}

async function cleanupPendingDeletions() {
  // (Implementation: CLOUD-014)
  const { processDueDeletions } = await import('../account/delete');
  await processDueDeletions();
}

async function collectMetrics() {
  // Push current counts to Prometheus pushgateway
}

async function purgeOldAudit() {
  // After 7 years (HIPAA), drop audit entries
  const cutoff = new Date(Date.now() - 7 * 365 * 24 * 60 * 60 * 1000).toISOString();
  await db('audit_log').where('occurred_at', '<', cutoff).del();
}
```

## TESTS

```bash
cd platform-cloud
test -f src/jobs/scheduler.ts || { echo "FAIL"; exit 1; }
grep -q "startScheduler" src/jobs/scheduler.ts || { echo "FAIL"; exit 1; }
echo "OK"
```
