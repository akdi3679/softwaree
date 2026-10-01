# TASK ID: CONTRACT-001.6
# TITLE: Define EventId branded type
# STATUS: pending
# DEPENDENCIES: CONTRACT-001.5
# ALLOWED FILES: product/packages/contracts/src/identity/event-id.ts, product/packages/contracts/src/identity/index.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Define the `EventId` branded type. Format: `evt_` + 22 base32 chars.

## REQUIRED IMPLEMENTATION

Create the file `product/packages/contracts/src/identity/event-id.ts`:

```typescript
import { z } from 'zod';
import type { Branded } from './brand';

/**
 * An event's identifier.
 * Format: `evt_<22-char base32 crockford>`.
 * Each event in the Admin's outbox has a unique EventId.
 * The ProjectSequence (separate from EventId) provides ordering.
 */
export type EventId = Branded<'EventId', string>;

export const EventIdSchema = z
  .string()
  .regex(/^evt_[0-9a-hjkmnp-z]{22}$/, 'Invalid EventId format')
  .brand<'EventId'>();
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
export type { EventId } from './event-id';
export { EventIdSchema } from './event-id';
```

## ACCEPTANCE CRITERIA
- [ ] File exists
- [ ] Format `evt_` + 22 base32 chars
- [ ] Exported

## TESTS

```bash
cd product
test -f packages/contracts/src/identity/event-id.ts || { echo "FAIL"; exit 1; }
grep -q "Branded<'EventId', string>" packages/contracts/src/identity/event-id.ts || { echo "FAIL"; exit 1; }
grep -q "evt_" packages/contracts/src/identity/event-id.ts || { echo "FAIL"; exit 1; }
pnpm --filter @product/contracts typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
