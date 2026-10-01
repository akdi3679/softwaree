# TASK ID: CONTRACT-005.5
# TITLE: Define ConflictError
# STATUS: pending
# DEPENDENCIES: CONTRACT-005.4
# ALLOWED FILES: product/packages/contracts/src/errors/conflict.ts, product/packages/contracts/src/errors/index.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Define `ConflictError` — for optimistic concurrency failures and uniqueness violations.

## REQUIRED IMPLEMENTATION

Create the file `product/packages/contracts/src/errors/conflict.ts`:

```typescript
import { z } from 'zod';
import { ErrorContractSchema } from './contract';

/**
 * Conflict error: the operation conflicts with the current state.
 *
 * Most common cause: optimistic concurrency — the entity was modified
 * between when the client read it and when the client tried to update.
 * Client should re-fetch and retry.
 *
 * Always category: CONFLICT. Retryable after re-fetch.
 *
 * `code` values:
 *   CONFLICT_VERSION_MISMATCH
 *   CONFLICT_DUPLICATE_KEY
 *   CONFLICT_INVARIANT_VIOLATION
 *   CONFLICT_RESOURCE_LOCKED
 */
export const ConflictErrorSchema = ErrorContractSchema.extend({
  category: z.literal('conflict'),
  code: z.string().regex(/^CONFLICT_/, 'must start with CONFLICT_'),
  details: z
    .object({
      expectedVersion: z.number().int().optional(),
      actualVersion: z.number().int().optional(),
      conflictingField: z.string().optional(),
    })
    .optional(),
});

export type ConflictError = z.infer<typeof ConflictErrorSchema>;
```

Update `product/packages/contracts/src/errors/index.ts` to add the export.

## ACCEPTANCE CRITERIA
- [ ] File exists
- [ ] `category: 'conflict'` literal
- [ ] `code` starts with `CONFLICT_`
- [ ] Optional expected/actual version in details

## TESTS

```bash
cd product
test -f packages/contracts/src/errors/conflict.ts || { echo "FAIL"; exit 1; }
grep -q "CONFLICT_" packages/contracts/src/errors/conflict.ts || { echo "FAIL: no prefix"; exit 1; }
pnpm --filter @product/contracts typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
