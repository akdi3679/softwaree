# TASK ID: CONTRACT-001.3
# TITLE: Define DeviceId branded type
# STATUS: pending
# DEPENDENCIES: CONTRACT-001.2
# ALLOWED FILES: product/packages/contracts/src/identity/device-id.ts, product/packages/contracts/src/identity/index.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Define the `DeviceId` branded type. Format: `dev_` + 22 base32 chars.

## REQUIRED IMPLEMENTATION

Create the file `product/packages/contracts/src/identity/device-id.ts`:

```typescript
import { z } from 'zod';
import type { Branded } from './brand';

/**
 * A device's stable identifier.
 * Format: `dev_<22-char base32 crockford>`.
 * Each device (Admin or User) has exactly one DeviceId, generated when the
 * device keypair is registered with the Cloud.
 */
export type DeviceId = Branded<'DeviceId', string>;

export const DeviceIdSchema = z
  .string()
  .regex(/^dev_[0-9a-hjkmnp-z]{22}$/, 'Invalid DeviceId format')
  .brand<'DeviceId'>();
```

Update `product/packages/contracts/src/identity/index.ts`:

```typescript
/**
 * Branded ID types and Zod schemas for every entity in the platform.
 */

export type { Branded } from './brand';
export type { ProjectId } from './project-id';
export { ProjectIdSchema } from './project-id';
export type { UserId } from './user-id';
export { UserIdSchema } from './user-id';
export type { DeviceId } from './device-id';
export { DeviceIdSchema } from './device-id';
```

## ACCEPTANCE CRITERIA
- [ ] `device-id.ts` exists
- [ ] Format is `dev_` + 22 base32 chars
- [ ] `DeviceId` is a separate brand from `ProjectId` and `UserId`
- [ ] `identity/index.ts` exports it

## TESTS

```bash
cd product

test -f packages/contracts/src/identity/device-id.ts || { echo "FAIL"; exit 1; }

grep -q "Branded<'DeviceId', string>" packages/contracts/src/identity/device-id.ts || { echo "FAIL: wrong brand"; exit 1; }
grep -q "dev_" packages/contracts/src/identity/device-id.ts || { echo "FAIL: wrong format"; exit 1; }

pnpm --filter @product/contracts typecheck > /dev/null 2>&1 || { echo "FAIL: typecheck"; exit 1; }
echo "OK"
```
