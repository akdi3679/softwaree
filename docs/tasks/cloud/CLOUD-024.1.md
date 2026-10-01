# TASK ID: CLOUD-024.1
# TITLE: Add Cloud: structured error responses (everywhere)
# STATUS: pending
# DEPENDENCIES: ARCH-023.2
# ALLOWED FILES: platform-cloud/src/middleware/error_handler.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Every error returns `{ error: { category, message, request_id, details? } }`.

## REQUIRED IMPLEMENTATION

Create `platform-cloud/src/middleware/error_handler.ts`:

```typescript
import { ErrorHandler } from 'hono';

export const errorHandler: ErrorHandler = (err, c) => {
  const request_id = c.get('request_id') ?? crypto.randomUUID();
  console.error(JSON.stringify({ type: 'error', request_id, error: err.message, stack: err.stack }));
  // Map known errors to status codes
  const status = mapErrorToStatus(err);
  return c.json({
    error: {
      category: mapErrorToCategory(err),
      message: humanMessage(err),
      request_id,
      details: process.env.NODE_ENV === 'production' ? undefined : { stack: err.stack },
    },
  }, status as 400 | 401 | 403 | 404 | 409 | 422 | 429 | 500);
};

function mapErrorToStatus(err: any): number {
  if (err.status) return err.status;
  if (err.name === 'ZodError') return 422;
  if (err.message?.startsWith('not found')) return 404;
  if (err.message?.startsWith('forbidden')) return 403;
  if (err.message?.startsWith('unauthorized')) return 401;
  return 500;
}
function mapErrorToCategory(err: any): string {
  if (err.name === 'ZodError') return 'validation';
  if (err.status === 404) return 'not_found';
  if (err.status === 403) return 'forbidden';
  if (err.status === 401) return 'auth';
  if (err.status === 429) return 'rate_limited';
  return 'internal';
}
function humanMessage(err: any): string {
  if (err.name === 'ZodError') return err.errors?.[0]?.message ?? 'validation failed';
  return err.message ?? 'internal server error';
}
```

## TESTS

```bash
cd platform-cloud
test -f src/middleware/error_handler.ts || { echo "FAIL"; exit 1; }
grep -q "errorHandler" src/middleware/error_handler.ts || { echo "FAIL"; exit 1; }
echo "OK"
```
