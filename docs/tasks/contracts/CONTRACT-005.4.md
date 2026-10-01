# TASK ID: CONTRACT-005.4
# TITLE: Define AuthorizationError
# STATUS: pending
# DEPENDENCIES: CONTRACT-005.3
# ALLOWED FILES: product/packages/contracts/src/errors/authorization.ts, product/packages/contracts/src/errors/index.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Define `AuthorizationError` — for permission denied scenarios.

## REQUIRED IMPLEMENTATION

Create the file `product/packages/contracts/src/errors/authorization.ts`:

```typescript
import { z } from 'zod';
import { ErrorContractSchema } from './contract';

/**
 * Authorization error: the actor does not have permission for this operation.
 *
 * Always category: AUTHORIZATION. Not retryable.
 *
 * `code` values include:
 *   AUTH_NOT_AUTHENTICATED
 *   AUTH_SESSION_EXPIRED
 *   AUTH_DEVICE_REVOKED
 *   AUTH_INSUFFICIENT_PERMISSION
 *   AUTH_PROJECT_INACTIVE
 *   AUTH_PLAN_RESTRICTION
 */
export const AuthorizationErrorSchema = ErrorContractSchema.extend({
  category: z.literal('authorization'),
  code: z.string().regex(/^AUTH_/, 'must start with AUTH_'),
  details: z
    .object({
      requiredPermission: z.string().optional(),
      currentPermissions: z.array(z.string()).optional(),
    })
    .optional(),
});

export type AuthorizationError = z.infer<typeof AuthorizationErrorSchema>;
```

Update `product/packages/contracts/src/errors/index.ts` to add the export.

## ACCEPTANCE CRITERIA
- [ ] File exists
- [ ] `category: 'authorization'` literal
- [ ] `code` starts with `AUTH_`
- [ ] Optional `requiredPermission` and `currentPermissions` in details

## TESTS

```bash
cd product
test -f packages/contracts/src/errors/authorization.ts || { echo "FAIL"; exit 1; }
grep -q "AUTH_" packages/contracts/src/errors/authorization.ts || { echo "FAIL: no prefix"; exit 1; }
grep -q "authorization" packages/contracts/src/errors/authorization.ts || { echo "FAIL: no category"; exit 1; }
pnpm --filter @product/contracts typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
