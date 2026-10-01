# TASK ID: CLOUD-012.1
# TITLE: Add Cloud: project-level rate limit override
# STATUS: pending
# DEPENDENCIES: FOODLAB-007.2
# ALLOWED FILES: platform-cloud/src/middleware/project_limit.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Enterprise plan = higher rate limits. Per-account override.

## REQUIRED IMPLEMENTATION

Create `platform-cloud/src/middleware/project_limit.ts`:

```typescript
import { Context, Next } from 'hono';
import { db } from '../db';
import type { AppEnv } from '../env';

const PLAN_LIMITS: Record<string, { events_per_min: number; backups_per_day: number; api_calls_per_min: number }> = {
  local:      { events_per_min: 100,  backups_per_day: 0,  api_calls_per_min: 60 },
  starter:    { events_per_min: 1_000, backups_per_day: 1,  api_calls_per_min: 600 },
  team:       { events_per_min: 10_000, backups_per_day: 7, api_calls_per_min: 6_000 },
  enterprise: { events_per_min: 100_000, backups_per_day: 30, api_calls_per_min: 60_000 },
};

export async function projectRateLimit(c: Context<AppEnv>, next: Next) {
  const project_id = c.req.param('project_id');
  if (!project_id) return next();
  const project: any = await db('projects').where({ id: project_id }).first();
  if (!project) return c.json({ error: { category: 'not_found', message: 'project' } }, 404);
  const limits = PLAN_LIMITS[project.plan] ?? PLAN_LIMITS.starter;
  // Use limits.events_per_min, etc., in your rate limiter
  c.set('plan_limits', limits);
  await next();
}
```

## TESTS

```bash
cd platform-cloud
test -f src/middleware/project_limit.ts || { echo "FAIL"; exit 1; }
grep -q "projectRateLimit" src/middleware/project_limit.ts || { echo "FAIL"; exit 1; }
echo "OK"
```
