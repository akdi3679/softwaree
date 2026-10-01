# TASK ID: SECURITY-001.2
# TITLE: Add security headers middleware
# STATUS: pending
# DEPENDENCIES: SECURITY-001.1
# ALLOWED FILES: platform-cloud/src/middleware/security-headers.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Add security headers to all Cloud responses (HSTS, X-Content-Type-Options, etc.).

## REQUIRED IMPLEMENTATION

Create `platform-cloud/src/middleware/security-headers.ts`:

```typescript
import type { Context, Next } from 'hono';

export async function securityHeaders(c: Context, next: Next) {
  await next();
  c.header('strict-transport-security', 'max-age=31536000; includeSubDomains');
  c.header('x-content-type-options', 'nosniff');
  c.header('x-frame-options', 'DENY');
  c.header('referrer-policy', 'no-referrer');
  c.header('permissions-policy', 'interest-cohort=()');
  c.header('content-security-policy', "default-src 'self'; frame-ancestors 'none'");
  // Remove server identification
  c.header('server', 'product-cloud');
}
```

Wire into `platform-cloud/src/app.ts`:

```typescript
import { securityHeaders } from './middleware/security-headers';
app.use('*', securityHeaders);
```

## TESTS

```bash
cd platform-cloud
test -f src/middleware/security-headers.ts || { echo "FAIL"; exit 1; }
grep -q "strict-transport-security" src/middleware/security-headers.ts || { echo "FAIL: no HSTS"; exit 1; }
pnpm typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
