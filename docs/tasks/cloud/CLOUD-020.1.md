# TASK ID: CLOUD-020.1
# TITLE: Add Cloud: per-IP rate limit (beyond per-account)
# STATUS: pending
# DEPENDENCIES: ADMIN-044.2
# ALLOWED FILES: platform-cloud/src/middleware/ip_rate.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Pre-abuse: limit requests per source IP across all unauthenticated endpoints.

## REQUIRED IMPLEMENTATION

Create `platform-cloud/src/middleware/ip_rate.ts`:

```typescript
import { Context, Next } from 'hono';

const memory = new Map<string, { count: number; reset_at: number }>();
const LIMIT = 600;     // 600 per minute per IP
const WINDOW_MS = 60_000;

export async function ipRateLimit(c: Context, next: Next) {
  const ip = c.req.header('cf-connecting-ip') ?? c.req.header('x-forwarded-for') ?? '0.0.0.0';
  const now = Date.now();
  const cur = memory.get(ip);
  if (!cur || cur.reset_at < now) {
    memory.set(ip, { count: 1, reset_at: now + WINDOW_MS });
    return next();
  }
  if (cur.count >= LIMIT) {
    return c.json({ error: { category: 'rate_limited', message: 'IP rate limit exceeded' } }, 429);
  }
  cur.count++;
  await next();
}
```

## TESTS

```bash
cd platform-cloud
test -f src/middleware/ip_rate.ts || { echo "FAIL"; exit 1; }
grep -q "ipRateLimit" src/middleware/ip_rate.ts || { echo "FAIL"; exit 1; }
echo "OK"
```
