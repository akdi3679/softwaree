# TASK ID: CONTRACT-011.2
# TITLE: Define Pagination response
# STATUS: pending
# DEPENDENCIES: CONTRACT-011.1
# ALLOWED FILES: product/packages/contracts/src/pagination/page.ts, product/packages/contracts/src/pagination/index.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Define `Page<T>` — generic paginated response wrapper.

## REQUIRED IMPLEMENTATION

Create the file `product/packages/contracts/src/pagination/page.ts`:

```typescript
import { z } from 'zod';

/**
 * Generic paginated response.
 */
export const PageSchema = <T extends z.ZodTypeAny>(item: T) =>
  z.object({
    items: z.array(item),
    nextCursor: z.string().optional(),
    previousCursor: z.string().optional(),
    total: z.number().int().optional(), // optional total count
    hasMore: z.boolean(),
  });

export interface Page<T> {
  items: T[];
  nextCursor?: string;
  previousCursor?: string;
  total?: number;
  hasMore: boolean;
}
```

Update `product/packages/contracts/src/pagination/index.ts`:

```typescript
export type { PaginationRequest } from './request';
export { PaginationRequestSchema } from './request';
export type { Page } from './page';
export { PageSchema } from './page';
```

## ACCEPTANCE CRITERIA
- [ ] File exists
- [ ] Generic `Page<T>` and `PageSchema<T>`
- [ ] Exported

## TESTS

```bash
cd product
test -f packages/contracts/src/pagination/page.ts || { echo "FAIL"; exit 1; }
grep -q "PageSchema" packages/contracts/src/pagination/page.ts || { echo "FAIL"; exit 1; }
pnpm --filter @product/contracts typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
