# TASK ID: CLOUD-002.6
# TITLE: Add correlation ID middleware
# STATUS: pending
# DEPENDENCIES: CLOUD-002.5
# ALLOWED FILES: platform-cloud/apps/api/src/middleware/correlation-id.ts, platform-cloud/apps/api/src/index.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Add a middleware that extracts or generates a correlation ID for every request, propagated to all logs and error responses.

## REQUIRED IMPLEMENTATION

Create `platform-cloud/apps/api/src/middleware/correlation-id.ts`:

```typescript
import type { Context, Next } from 'hono';
import { randomUUID } from 'node:crypto';

const HEADER = 'X-Correlation-Id';

/**
 * Read or generate a correlation ID. Propagated to logs and error responses.
 */
export function correlationIdMiddleware() {
  return async (c: Context, next: Next) => {
    const incoming = c.req.header(HEADER);
    const id = incoming && incoming.length <= 128 ? incoming : randomUUID();
    c.set('correlationId', id);
    c.header(HEADER, id);
    await next();
  };
}
```

Modify `platform-cloud/apps/api/src/index.ts` to use the middleware (insert after logger):

```typescript
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { correlationIdMiddleware } from './middleware/correlation-id';
import { errorMiddleware } from './middleware/error';

const app = new Hono();

app.use('*', logger());
app.use('*', correlationIdMiddleware());
app.use('*', errorMiddleware());

app.get('/health', (c) => c.json({ status: 'ok' }));

const v1 = new Hono();
app.route('/v1', v1);

const port = Number(process.env.PORT ?? 8080);

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`[api] listening on http://localhost:${info.port}`);
});
```

## TESTS

```bash
cd platform-cloud
test -f apps/api/src/middleware/correlation-id.ts || { echo "FAIL"; exit 1; }
grep -q "correlationIdMiddleware" apps/api/src/index.ts || { echo "FAIL: not wired"; exit 1; }
pnpm --filter @cloud/api typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
