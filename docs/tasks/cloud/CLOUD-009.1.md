# TASK ID: CLOUD-009.1
# TITLE: Add Cloud background job queue (Postgres-based)
# STATUS: pending
# DEPENDENCIES: USER-007.4
# ALLOWED FILES: platform-cloud/src/jobs/queue.ts, platform-cloud/src/jobs/runner.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
A simple Postgres-based job queue for async work (emails, exports, etc.) without adding NATS at Stage 0.

## REQUIRED IMPLEMENTATION

Create `platform-cloud/src/jobs/queue.ts`:

```typescript
import { db } from '../db';
import { jobs } from '../db/schema';
import { eq, and, lte } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';

export type JobType =
  | 'send_email'
  | 'export_data'
  | 'module_publish_review'
  | 'backup_verification';

export type JobState = 'queued' | 'running' | 'completed' | 'failed' | 'dead';

export interface Job {
  id: string;
  type: JobType;
  payload: any;
  state: JobState;
  attempts: number;
  max_attempts: number;
  run_after: string;
  last_error: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

export async function enqueue(type: JobType, payload: any, opts?: { runAfter?: Date; maxAttempts?: number }) {
  const id = randomUUID();
  await db.insert(jobs).values({
    id,
    type,
    payload: JSON.stringify(payload),
    state: 'queued',
    attempts: 0,
    maxAttempts: opts?.maxAttempts ?? 3,
    runAfter: (opts?.runAfter ?? new Date()).toISOString(),
    createdAt: new Date().toISOString(),
  });
  return id;
}

export async function dequeue(types: JobType[]): Promise<Job | null> {
  const now = new Date().toISOString();
  const row = await db.select().from(jobs)
    .where(and(eq(jobs.state, 'queued'), lte(jobs.runAfter, now)))
    .limit(1);
  if (row.length === 0) return null;
  // Mark as running atomically
  await db.update(jobs)
    .set({ state: 'running', startedAt: now, attempts: row[0].attempts + 1 })
    .where(eq(jobs.id, row[0].id));
  return { ...row[0], state: 'running', startedAt: now, attempts: row[0].attempts + 1 };
}

export async function complete(id: string) {
  await db.update(jobs).set({ state: 'completed', completedAt: new Date().toISOString() }).where(eq(jobs.id, id));
}

export async function fail(id: string, error: string, willRetry: boolean) {
  if (willRetry) {
    await db.update(jobs).set({ state: 'queued', lastError: error }).where(eq(jobs.id, id));
  } else {
    await db.update(jobs).set({ state: 'dead', lastError: error, completedAt: new Date().toISOString() }).where(eq(jobs.id, id));
  }
}
```

Create `platform-cloud/src/jobs/runner.ts`:

```typescript
import { dequeue, complete, fail, JobType } from './queue';
import { logger } from '../log/logger';

const HANDLERS: Record<JobType, (payload: any) => Promise<void>> = {
  send_email: async (p) => { /* call email.send */ },
  export_data: async (p) => { /* generate export */ },
  module_publish_review: async (p) => { /* automated review */ },
  backup_verification: async (p) => { /* download and verify */ },
};

const MAX_BACKOFF_MS = 5 * 60 * 1000; // 5 minutes

export function start() {
  setInterval(async () => {
    try {
      while (true) {
        const job = await dequeue(Object.keys(HANDLERS) as JobType[]);
        if (!job) break;
        const handler = HANDLERS[job.type];
        try {
          await handler(JSON.parse(job.payload as string));
          await complete(job.id);
        } catch (e: any) {
          const willRetry = job.attempts < job.maxAttempts;
          await fail(job.id, e?.message ?? String(e), willRetry);
          if (!willRetry) logger('error', 'job dead', { id: job.id, type: job.type, error: e?.message });
        }
      }
    } catch (e) {
      logger('error', 'job loop failed', { error: String(e) });
    }
  }, 1000);
}
```

Add SQL migration `0003_jobs.sql`:

```sql
CREATE TABLE IF NOT EXISTS jobs (
    id UUID PRIMARY KEY,
    type TEXT NOT NULL,
    payload JSONB NOT NULL,
    state TEXT NOT NULL DEFAULT 'queued',
    attempts INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 3,
    run_after TIMESTAMPTZ NOT NULL,
    last_error TEXT,
    created_at TIMESTAMPTZ NOT NULL,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_jobs_state_runafter ON jobs(state, run_after);
```

## TESTS

```bash
cd platform-cloud
test -f src/jobs/queue.ts || { echo "FAIL"; exit 1; }
test -f src/jobs/runner.ts || { echo "FAIL: no runner"; exit 1; }
grep -q "enqueue" src/jobs/queue.ts || { echo "FAIL"; exit 1; }
pnpm typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
