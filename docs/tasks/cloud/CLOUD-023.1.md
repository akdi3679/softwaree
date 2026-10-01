# TASK ID: CLOUD-023.1
# TITLE: Add Cloud: CSRF protection
# STATUS: pending
# DEPENDENCIES: ADMIN-067.2
# ALLOWED FILES: platform-cloud/src/middleware/csrf.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
CSRF tokens for cookie-based sessions (none in v1 but defense in depth).

## REQUIRED IMPLEMENTATION

Create `platform-cloud/src/middleware/csrf.ts`:

```typescript
import { Context, Next } from 'hono';
import { randomBytes } from 'crypto';

export async function csrf(c: Context, next: Next) {
  // v1: We use Bearer tokens for auth (not cookies), so CSRF is not strictly
  // needed. But we add this guard for defense in depth: if a future change
  // introduces cookie auth, this catches it.
  if (c.req.method === 'GET' || c.req.method === 'HEAD' || c.req.method === 'OPTIONS') {
    return next();
  }
  const origin = c.req.header('origin');
  if (!origin || !isAllowedOrigin(origin)) {
    return c.json({ error: { category: 'forbidden', message: 'invalid origin' } }, 403);
  }
  await next();
}

function isAllowedOrigin(origin: string): boolean {
  const allowed = (process.env.CORS_ALLOWED_ORIGINS ?? 'https://portal.example.com').split(',');
  return allowed.some((o) => o.trim() === origin);
}
```

## TESTS

```bash
cd platform-cloud
test -f src/middleware/csrf.ts || { echo "FAIL"; exit 1; }
grep -q "csrf" src/middleware/csrf.ts || { echo "FAIL"; exit 1; }
echo "OK"
```
