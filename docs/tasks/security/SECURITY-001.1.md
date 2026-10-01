# TASK ID: SECURITY-001.1
# TITLE: Add rate limiter middleware to Cloud
# STATUS: pending
# DEPENDENCIES: MODULE-002.5
# ALLOWED FILES: platform-cloud/src/middleware/rate-limit.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Add a sliding-window rate limiter middleware to the Cloud Hono app.

## REQUIRED IMPLEMENTATION

Create `platform-cloud/src/middleware/rate-limit.ts`:

```typescript
import type { Context, Next } from 'hono';
import { getConnInfo } from 'hono/bun';

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

interface RateLimitConfig {
  /** Window size in milliseconds */
  windowMs: number;
  /** Max requests per window */
  max: number;
  /** Key extractor */
  keyFn: (c: Context) => string;
}

export function rateLimit(config: RateLimitConfig) {
  return async (c: Context, next: Next) => {
    const key = config.keyFn(c);
    const now = Date.now();
    const bucket = buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + config.windowMs });
    } else if (bucket.count >= config.max) {
      c.header('retry-after', Math.ceil((bucket.resetAt - now) / 1000).toString());
      return c.json({
        error: { code: 'RATE_LIMITED', message: 'Too many requests', category: 'rate_limited' },
      }, 429);
    } else {
      bucket.count++;
    }
    await next();
  };
}

/** Per-IP rate limiter for public endpoints. */
export const publicRateLimit = rateLimit({
  windowMs: 60_000,
  max: 60,
  keyFn: (c) => {
    const info = getConnInfo(c);
    return info.remote.address ?? 'unknown';
  },
});

/** Per-account rate limiter (requires auth). */
export const accountRateLimit = rateLimit({
  windowMs: 60_000,
  max: 600,
  keyFn: (c) => {
    const accountId = c.get('accountId');
    return accountId ?? 'anonymous';
  },
});

/** Per-device rate limiter (auth-required). */
export const deviceRateLimit = rateLimit({
  windowMs: 60_000,
  max: 300,
  keyFn: (c) => {
    const deviceId = c.get('deviceId');
    return deviceId ?? 'unknown';
  },
});
```

Add to `package.json`:
```json
"dependencies": {
  "hono": "^4.0.0"
}
```

Wire into `platform-cloud/src/app.ts`:

```typescript
import { publicRateLimit, accountRateLimit } from './middleware/rate-limit';

app.use('/v1/accounts/*', publicRateLimit);
app.use('/v1/*', accountRateLimit);
```

## TESTS

```bash
cd platform-cloud
test -f src/middleware/rate-limit.ts || { echo "FAIL"; exit 1; }
grep -q "RATE_LIMITED" src/middleware/rate-limit.ts || { echo "FAIL"; exit 1; }
pnpm typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
