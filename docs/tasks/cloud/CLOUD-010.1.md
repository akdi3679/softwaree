# TASK ID: CLOUD-010.1
# TITLE: Add Cloud: per-account rate limit (Cloudflare-style)
# STATUS: pending
# DEPENDENCIES: MODULE-005.2
# ALLOWED FILES: platform-cloud/src/middleware/rate_limit.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Limit requests per account + per IP. Sliding window, in-memory + Redis at Stage 2+.

## REQUIRED IMPLEMENTATION

Create `platform-cloud/src/middleware/rate_limit.ts`:

```typescript
import { Context, Next } from 'hono';
import type { AppEnv } from '../env';

interface Bucket {
  count: number;
  reset_at: number;
}

const memory = new Map<string, Bucket>();

export function rateLimit(opts: { per_account_per_min: number; per_ip_per_min: number }) {
  return async (c: Context<AppEnv>, next: Next) => {
    const account_id = c.get('account_id');
    const ip = c.req.header('cf-connecting-ip') ?? c.req.header('x-forwarded-for') ?? '0.0.0.0';
    const now = Date.now();
    const minute = 60_000;

    const keys = [
      { k: `acct:${account_id}`, limit: opts.per_account_per_min },
      { k: `ip:${ip}`, limit: opts.per_ip_per_min },
    ];
    for (const { k, limit } of keys) {
      const cur = memory.get(k);
      if (!cur || cur.reset_at < now) {
        memory.set(k, { count: 1, reset_at: now + minute });
        continue;
      }
      if (cur.count >= limit) {
        return c.json({ error: { category: 'rate_limited', message: 'too many requests' } }, 429);
      }
      cur.count++;
    }
    await next();
  };
}
```

## TESTS

```bash
cd platform-cloud
test -f src/middleware/rate_limit.ts || { echo "FAIL"; exit 1; }
grep -q "rateLimit" src/middleware/rate_limit.ts || { echo "FAIL"; exit 1; }
echo "OK"
```
