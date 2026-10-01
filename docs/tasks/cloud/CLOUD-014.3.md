# TASK ID: CLOUD-014.3
# TITLE: Add HTTP metrics middleware
# STATUS: pending
# DEPENDENCIES: CLOUD-014.2
# ALLOWED FILES: platform-cloud/apps/api/src/middleware/metrics.ts, platform-cloud/apps/api/src/index.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Auto-record request metrics for every HTTP call.

## REQUIRED IMPLEMENTATION

Create `platform-cloud/apps/api/src/middleware/metrics.ts`:

```typescript
import type { Context, Next } from 'hono';
import { httpRequestsTotal, httpRequestDurationSeconds } from '../observability/metrics';

/**
 * Record metrics for every request.
 */
export function metricsMiddleware() {
  return async (c: Context, next: Next) => {
    const start = process.hrtime.bigint();
    await next();
    const duration = Number(process.hrtime.bigint() - start) / 1e9;
    const route = c.req.routePath ?? c.req.path;
    const method = c.req.method;
    const status = String(c.res.status);
    httpRequestsTotal.inc({ method, route, status });
    httpRequestDurationSeconds.observe({ method, route, status }, duration);
  };
}
```

Update `platform-cloud/apps/api/src/index.ts` to use the middleware:

```typescript
import { metricsMiddleware } from './middleware/metrics';
// ... after logger/correlation/error ...
app.use('*', metricsMiddleware());
```

## TESTS

```bash
cd platform-cloud
test -f apps/api/src/middleware/metrics.ts || { echo "FAIL"; exit 1; }
grep -q "metricsMiddleware" apps/api/src/index.ts || { echo "FAIL: not wired"; exit 1; }
pnpm --filter @cloud/api typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
