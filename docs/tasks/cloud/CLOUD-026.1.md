# TASK ID: CLOUD-026.1
# TITLE: Add Cloud: per-route latency metrics (Prometheus)
# STATUS: pending
# DEPENDENCIES: ADMIN-076.2
# ALLOWED FILES: platform-cloud/src/metrics/latency.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Histogram per route + per status. Buckets for p50/p95/p99.

## REQUIRED IMPLEMENTATION

Create `platform-cloud/src/metrics/latency.ts`:

```typescript
import { Context, Next } from 'hono';
import { Counter, Histogram, Registry } from 'prom-client';

const registry = new Registry();
const latencyHistogram = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request latency',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [registry],
});
const counter = new Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status'],
  registers: [registry],
});

export async function metricsMiddleware(c: Context, next: Next) {
  const start = Date.now();
  await next();
  const elapsed = (Date.now() - start) / 1000;
  const route = c.req.routePath ?? c.req.path;
  const labels = { method: c.req.method, route, status: String(c.res.status) };
  latencyHistogram.observe(labels, elapsed);
  counter.inc(labels);
}

export function metricsHandler() {
  return registry.metrics();
}
```

## TESTS

```bash
cd platform-cloud
test -f src/metrics/latency.ts || { echo "FAIL"; exit 1; }
grep -q "metricsMiddleware" src/metrics/latency.ts || { echo "FAIL"; exit 1; }
echo "OK"
```
