# TASK ID: CONTRACT-005.1
# TITLE: Define ErrorCategory enum
# STATUS: pending
# DEPENDENCIES: CONTRACT-004.2
# ALLOWED FILES: product/packages/contracts/src/errors/category.ts, product/packages/contracts/src/errors/index.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Define `ErrorCategory` enum — categorizes all errors in the platform. Used for retry decisions, logging, and UI display.

## REQUIRED IMPLEMENTATION

Create the file `product/packages/contracts/src/errors/category.ts`:

```typescript
import { z } from 'zod';

/**
 * Categories of errors across the platform.
 *
 * - VALIDATION: bad input (user's fault). Not retryable.
 * - AUTHORIZATION: permission denied. Not retryable.
 * - NOT_FOUND: resource doesn't exist. Not retryable.
 * - CONFLICT: optimistic concurrency failure. Client may retry with fresh state.
 * - RATE_LIMITED: too many requests. Retryable after backoff.
 * - TRANSIENT: temporary failure (network, db blip). Retryable.
 * - PERMANENT: server error that won't fix itself. Not retryable without intervention.
 * - SECURITY: security violation. May trigger device revocation.
 * - UNAVAILABLE: dependency is down. Retryable.
 */
export const ErrorCategory = {
  VALIDATION: 'validation',
  AUTHORIZATION: 'authorization',
  NOT_FOUND: 'not_found',
  CONFLICT: 'conflict',
  RATE_LIMITED: 'rate_limited',
  TRANSIENT: 'transient',
  PERMANENT: 'permanent',
  SECURITY: 'security',
  UNAVAILABLE: 'unavailable',
} as const;

export type ErrorCategory = (typeof ErrorCategory)[keyof typeof ErrorCategory];

export const ErrorCategorySchema = z.nativeEnum(ErrorCategory);
```

Create the file `product/packages/contracts/src/errors/index.ts`:

```typescript
/**
 * Error contracts.
 */

export { ErrorCategory } from './category';
export type { ErrorCategory as ErrorCategoryType } from './category';
export { ErrorCategorySchema } from './category';
```

## ACCEPTANCE CRITERIA
- [ ] `ErrorCategory` has exactly 9 values
- [ ] Both runtime const and type exported (using `as const` pattern)
- [ ] Zod schema present
- [ ] No business logic in this file

## TESTS

```bash
cd product
test -f packages/contracts/src/errors/category.ts || { echo "FAIL"; exit 1; }
test -f packages/contracts/src/errors/index.ts || { echo "FAIL: no index"; exit 1; }

# Count enum values
COUNT=$(grep -c "^\s*[A-Z_]\+:" packages/contracts/src/errors/category.ts | head -1)
test "$COUNT" -eq 9 || { echo "FAIL: expected 9 categories, got $COUNT"; exit 1; }

pnpm --filter @product/contracts typecheck > /dev/null 2>&1 || { echo "FAIL: typecheck"; exit 1; }
echo "OK"
```
