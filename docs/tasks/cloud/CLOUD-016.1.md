# TASK ID: CLOUD-016.1
# TITLE: Add Cloud: healthcheck details + dependency status
# STATUS: pending
# DEPENDENCIES: ADMIN-031.2
# ALLOWED FILES: platform-cloud/src/health/deep.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
/health returns OK only if Postgres + MinIO + our discovery service all reachable.

## REQUIRED IMPLEMENTATION

Create `platform-cloud/src/health/deep.ts`:

```typescript
import { db } from '../db';
import { minio } from '../blob';
import { tailnetPing } from '../tailscale';

interface Health {
  ok: boolean;
  checks: { name: string; ok: boolean; latency_ms: number; error?: string }[];
  version: string;
  uptime_s: number;
}

const start = Date.now();
const VERSION = process.env.VERSION ?? 'dev';

export async function deepHealth(): Promise<Health> {
  const checks = await Promise.all([
    check('postgres', async () => {
      await db.raw('SELECT 1');
    }),
    check('minio', async () => {
      await minio.listBuckets();
    }),
    check('tailscale', async () => {
      await tailnetPing();
    }),
  ]);
  return {
    ok: checks.every((c) => c.ok),
    checks,
    version: VERSION,
    uptime_s: Math.floor((Date.now() - start) / 1000),
  };
}

async function check(name: string, fn: () => Promise<void>) {
  const t0 = Date.now();
  try { await fn(); return { name, ok: true, latency_ms: Date.now() - t0 }; }
  catch (e: any) { return { name, ok: false, latency_ms: Date.now() - t0, error: e.message }; }
}
```

## TESTS

```bash
cd platform-cloud
test -f src/health/deep.ts || { echo "FAIL"; exit 1; }
grep -q "deepHealth" src/health/deep.ts || { echo "FAIL"; exit 1; }
echo "OK"
```
