# TASK ID: CONTRACT-001.4
# TITLE: Define SessionId branded type
# STATUS: pending
# DEPENDENCIES: CONTRACT-001.3
# ALLOWED FILES: product/packages/contracts/src/identity/session-id.ts, product/packages/contracts/src/identity/index.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Define the `SessionId` branded type. Format: `sess_` + 22 base32 chars. Short-lived, refreshable.

## REQUIRED IMPLEMENTATION

Create the file `product/packages/contracts/src/identity/session-id.ts`:

```typescript
import { z } from 'zod';
import type { Branded } from './brand';

/**
 * A session's identifier.
 * Format: `sess_<22-char base32 crockford>`.
 * Sessions are short-lived (15 min) and refreshable. Each session is bound to
 * a specific Account + Device + Project (when applicable).
 */
export type SessionId = Branded<'SessionId', string>;

export const SessionIdSchema = z
  .string()
  .regex(/^sess_[0-9a-hjkmnp-z]{22}$/, 'Invalid SessionId format')
  .brand<'SessionId'>();
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
```

## ACCEPTANCE CRITERIA
- [ ] `session-id.ts` exists
- [ ] Format `sess_` + 22 base32 chars
- [ ] Exported from `identity/index.ts`
- [ ] Distinct brand

## TESTS

```bash
cd product
test -f packages/contracts/src/identity/session-id.ts || { echo "FAIL"; exit 1; }
grep -q "Branded<'SessionId', string>" packages/contracts/src/identity/session-id.ts || { echo "FAIL: wrong brand"; exit 1; }
grep -q "sess_" packages/contracts/src/identity/session-id.ts || { echo "FAIL: wrong format"; exit 1; }
pnpm --filter @product/contracts typecheck > /dev/null 2>&1 || { echo "FAIL: typecheck"; exit 1; }
echo "OK"
```
