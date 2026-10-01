# TASK ID: CONTRACT-012.4
# TITLE: Define MembershipState enum
# STATUS: pending
# DEPENDENCIES: CONTRACT-012.3
# ALLOWED FILES: product/packages/contracts/src/domain/membership-state.ts, product/packages/contracts/src/domain/index.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Define `MembershipState` — lifecycle states a user membership in a project can be in.

## REQUIRED IMPLEMENTATION

Create the file `product/packages/contracts/src/domain/membership-state.ts`:

```typescript
import { z } from 'zod';

/**
 * Membership lifecycle states.
 *
 *  PENDING_INVITATION → PENDING_APPROVAL → ACTIVE → (SUSPENDED | REMOVED)
 *
 * - PENDING_INVITATION: invitation sent, user has not yet accepted
 * - PENDING_APPROVAL: user accepted, admin has not yet approved
 * - ACTIVE: member can access the project
 * - SUSPENDED: temporarily blocked (e.g., plan downgraded)
 * - REMOVED: terminal, removed from project
 */
export const MembershipState = {
  PENDING_INVITATION: 'pending_invitation',
  PENDING_APPROVAL: 'pending_approval',
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  REMOVED: 'removed',
} as const;

export type MembershipState = (typeof MembershipState)[keyof typeof MembershipState];

export const MembershipStateSchema = z.nativeEnum(MembershipState);
```

Update `product/packages/contracts/src/domain/index.ts` to add the export.

## TESTS

```bash
cd product
test -f packages/contracts/src/domain/membership-state.ts || { echo "FAIL"; exit 1; }
COUNT=$(grep -c "^\s*[A-Z_]\+:" packages/contracts/src/domain/membership-state.ts)
test "$COUNT" -eq 5 || { echo "FAIL: $COUNT"; exit 1; }
pnpm --filter @product/contracts typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
