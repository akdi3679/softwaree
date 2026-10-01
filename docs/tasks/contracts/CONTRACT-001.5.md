# TASK ID: CONTRACT-001.5
# TITLE: Define CommandId branded type
# STATUS: pending
# DEPENDENCIES: CONTRACT-001.4
# ALLOWED FILES: product/packages/contracts/src/identity/command-id.ts, product/packages/contracts/src/identity/index.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Define the `CommandId` branded type. Format: `cmd_` + 22 base32 chars. UUIDv7 in practice for monotonic ordering.

## REQUIRED IMPLEMENTATION

Create the file `product/packages/contracts/src/identity/command-id.ts`:

```typescript
import { z } from 'zod';
import type { Branded } from './brand';

/**
 * A command's identifier.
 * Format: `cmd_<22-char base32 crockford>`.
 * Commands are identified by an Idempotency-Key, generated client-side
 * (typically UUIDv7 for monotonic ordering).
 */
export type CommandId = Branded<'CommandId', string>;

export const CommandIdSchema = z
  .string()
  .regex(/^cmd_[0-9a-hjkmnp-z]{22}$/, 'Invalid CommandId format')
  .brand<'CommandId'>();
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
export type { SessionId } from './session-id';
export { SessionIdSchema } from './session-id';
export type { CommandId } from './command-id';
export { CommandIdSchema } from './command-id';
```

## ACCEPTANCE CRITERIA
- [ ] File exists
- [ ] Format `cmd_` + 22 base32 chars
- [ ] Exported

## TESTS

```bash
cd product
test -f packages/contracts/src/identity/command-id.ts || { echo "FAIL"; exit 1; }
grep -q "Branded<'CommandId', string>" packages/contracts/src/identity/command-id.ts || { echo "FAIL"; exit 1; }
grep -q "cmd_" packages/contracts/src/identity/command-id.ts || { echo "FAIL"; exit 1; }
pnpm --filter @product/contracts typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
