# TASK ID: CONTRACT-011.1
# TITLE: Define Pagination request
# STATUS: pending
# DEPENDENCIES: CONTRACT-010.8
# ALLOWED FILES: product/packages/contracts/src/pagination/request.ts, product/packages/contracts/src/pagination/index.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Define `PaginationRequest` — standard cursor-based pagination for queries and sync.

## REQUIRED IMPLEMENTATION

Create the file `product/packages/contracts/src/pagination/request.ts`:

```typescript
import { z } from 'zod';

/**
 * Standard cursor-based pagination request.
 *
 * `cursor` is opaque to the client; the server returns it in the response.
 * `limit` is the max number of items (server may return fewer).
 */
export const PaginationRequestSchema = z.object({
  cursor: z.string().optional(), // opaque
  limit: z.number().int().min(1).max(500).default(50),
  direction: z.enum(['forward', 'backward']).default('forward'),
});

export type PaginationRequest = z.infer<typeof PaginationRequestSchema>;
```

Create the file `product/packages/contracts/src/pagination/index.ts`:

```typescript
/**
 * Pagination types.
 */

export type { PaginationRequest } from './request';
export { PaginationRequestSchema } from './request';
```

## ACCEPTANCE CRITERIA
- [ ] File exists
- [ ] Cursor + limit + direction
- [ ] Exported

## TESTS

```bash
cd product
test -f packages/contracts/src/pagination/request.ts || { echo "FAIL"; exit 1; }
test -f packages/contracts/src/pagination/index.ts || { echo "FAIL: no index"; exit 1; }
grep -q "PaginationRequest" packages/contracts/src/pagination/request.ts || { echo "FAIL"; exit 1; }
pnpm --filter @product/contracts typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
