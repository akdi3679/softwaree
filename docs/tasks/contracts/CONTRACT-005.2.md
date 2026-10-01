# TASK ID: CONTRACT-005.2
# TITLE: Define ErrorContract base type
# STATUS: pending
# DEPENDENCIES: CONTRACT-005.1
# ALLOWED FILES: product/packages/contracts/src/errors/contract.ts, product/packages/contracts/src/errors/index.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Define `ErrorContract` — the base shape for all errors that cross the IPC/network boundary. Every error has a code, category, message, and optional details.

## REQUIRED IMPLEMENTATION

Create the file `product/packages/contracts/src/errors/contract.ts`:

```typescript
import { z } from 'zod';
import { ErrorCategorySchema } from './category';

/**
 * Base shape of every error contract in the platform.
 *
 * Every error that crosses an IPC boundary (Tauri invoke, WebSocket message,
 * HTTP response) uses this shape. Specific error types extend it.
 *
 * - `code`: machine-readable identifier (e.g., 'PROJECT_NOT_FOUND')
 * - `category`: classification for retry/UI decisions
 * - `message`: human-readable, may be localized in future
 * - `details`: optional structured details (key-value)
 * - `correlationId`: traces back to the originating command/query
 * - `timestamp`: when the error occurred
 */
export const ErrorContractSchema = z.object({
  code: z.string().min(1).max(128),
  category: ErrorCategorySchema,
  message: z.string().min(1).max(2048),
  details: z.record(z.string(), z.unknown()).optional(),
  correlationId: z.string().uuid().optional(),
  timestamp: z.string().datetime(), // ISO 8601
});

export type ErrorContract = z.infer<typeof ErrorContractSchema>;
```

Update `product/packages/contracts/src/errors/index.ts`:

```typescript
/**
 * Error contracts.
 */

export { ErrorCategory } from './category';
export type { ErrorCategory as ErrorCategoryType } from './category';
export { ErrorCategorySchema } from './category';
export type { ErrorContract } from './contract';
export { ErrorContractSchema } from './contract';
```

## ACCEPTANCE CRITERIA
- [ ] File exists
- [ ] `ErrorContractSchema` is a Zod object with: code, category, message, details (optional), correlationId (optional), timestamp
- [ ] `timestamp` must be ISO 8601 string
- [ ] `code` length 1-128

## TESTS

```bash
cd product
test -f packages/contracts/src/errors/contract.ts || { echo "FAIL"; exit 1; }
grep -q "ErrorContractSchema" packages/contracts/src/errors/contract.ts || { echo "FAIL: no schema"; exit 1; }
grep -q "z.record" packages/contracts/src/errors/contract.ts || { echo "FAIL: no details"; exit 1; }
pnpm --filter @product/contracts typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
