# TASK ID: CLOUD-002.5
# TITLE: Create Hono error handler middleware
# STATUS: pending
# DEPENDENCIES: CLOUD-002.4
# ALLOWED FILES: platform-cloud/apps/api/src/middleware/error.ts, platform-cloud/apps/api/src/index.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
Create a centralized error handler that converts thrown errors to the `ErrorContract` shape.

## REQUIRED IMPLEMENTATION

Create `platform-cloud/apps/api/src/middleware/error.ts`:

```typescript
import type { Context, Next } from 'hono';
import { ErrorCategory } from '@product/contracts';
import type { ErrorContract } from '@product/contracts';

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly category: (typeof ErrorCategory)[keyof typeof ErrorCategory],
    public readonly code: string,
    message: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
  }
}

export function errorMiddleware() {
  return async (c: Context, next: Next) => {
    try {
      await next();
    } catch (err) {
      const timestamp = new Date().toISOString();
      const correlationId = c.get('correlationId') ?? undefined;

      if (err instanceof HttpError) {
        const body: ErrorContract = {
          code: err.code,
          category: err.category,
          message: err.message,
          details: err.details,
          correlationId,
          timestamp,
        };
        return c.json(body, err.status as 400 | 401 | 403 | 404 | 409 | 429 | 500 | 503);
      }

      console.error('[api] unhandled error', err);
      const body: ErrorContract = {
        code: 'INTERNAL_ERROR',
        category: 'permanent',
        message: 'Internal server error',
        correlationId,
        timestamp,
      };
      return c.json(body, 500);
    }
  };
}
```

Modify `platform-cloud/apps/api/src/index.ts` to use the middleware:

```typescript
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { errorMiddleware } from './middleware/error';

const app = new Hono();

app.use('*', logger());
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
test -f apps/api/src/middleware/error.ts || { echo "FAIL"; exit 1; }
grep -q "HttpError" apps/api/src/middleware/error.ts || { echo "FAIL"; exit 1; }
grep -q "errorMiddleware" apps/api/src/index.ts || { echo "FAIL: not wired"; exit 1; }
pnpm --filter @cloud/api typecheck > /dev/null 2>&1 || { echo "FAIL: typecheck"; exit 1; }
echo "OK"
```
