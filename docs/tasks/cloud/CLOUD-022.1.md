# TASK ID: CLOUD-022.1
# TITLE: Add Cloud: full request logging (structured JSON)
# STATUS: pending
# DEPENDENCIES: ADMIN-065.2
# ALLOWED FILES: platform-cloud/src/middleware/access_log.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Every request: method, path, status, latency, account, request_id.

## REQUIRED IMPLEMENTATION

Create `platform-cloud/src/middleware/access_log.ts`:

```typescript
import { Context, Next } from 'hono';

export async function accessLog(c: Context, next: Next) {
  const start = Date.now();
  const request_id = crypto.randomUUID();
  c.set('request_id', request_id);
  await next();
  const elapsed = Date.now() - start;
  const account_id = c.get('account_id');
  console.log(JSON.stringify({
    type: 'access',
    request_id,
    method: c.req.method,
    path: c.req.path,
    status: c.res.status,
    latency_ms: elapsed,
    account_id: account_id ?? null,
    ip: c.req.header('cf-connecting-ip') ?? c.req.header('x-forwarded-for') ?? null,
    user_agent: c.req.header('user-agent') ?? null,
  }));
}
```

## TESTS

```bash
cd platform-cloud
test -f src/middleware/access_log.ts || { echo "FAIL"; exit 1; }
grep -q "accessLog" src/middleware/access_log.ts || { echo "FAIL"; exit 1; }
echo "OK"
```
