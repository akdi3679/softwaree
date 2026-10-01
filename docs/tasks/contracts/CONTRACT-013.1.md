# TASK ID: CONTRACT-013.1
# TITLE: Define Account entity
# STATUS: pending
# DEPENDENCIES: CONTRACT-012.6
# ALLOWED FILES: product/packages/contracts/src/identity-domain/account.ts, product/packages/contracts/src/identity-domain/index.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Define the `Account` entity — the Cloud's record of a customer's account. Distinct from User, which is a project membership.

## REQUIRED IMPLEMENTATION

```bash
mkdir -p product/packages/contracts/src/identity-domain
```

Create the file `product/packages/contracts/src/identity-domain/account.ts`:

```typescript
import { z } from 'zod';
import { UserIdSchema } from '../identity/user-id';

/**
 * A customer account in the Cloud.
 *
 * An account can own multiple projects (Plan 4) and can be the
 * "account owner" for billing. The account's user (UserId) is the
 * first user that registered; this is the "primary" user.
 */
export const AccountStatus = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  DELETED: 'deleted',
} as const;

export type AccountStatus = (typeof AccountStatus)[keyof typeof AccountStatus];

export const AccountSchema = z.object({
  userId: UserIdSchema, // the primary user
  email: z.string().email(),
  displayName: z.string().min(1).max(256),
  status: z.nativeEnum(AccountStatus),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  lastLoginAt: z.string().datetime().optional(),
  emailVerifiedAt: z.string().datetime().optional(),
});

export type Account = z.infer<typeof AccountSchema>;
```

Create the file `product/packages/contracts/src/identity-domain/index.ts`:

```typescript
export { AccountStatus } from './account';
export type { AccountStatus as AccountStatusValue } from './account';
export type { Account } from './account';
export { AccountSchema } from './account';
```

## TESTS

```bash
cd product
test -f packages/contracts/src/identity-domain/account.ts || { echo "FAIL"; exit 1; }
pnpm --filter @product/contracts typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
