# TASK ID: CONTRACT-014.2
# TITLE: Define Membership entity
# STATUS: pending
# DEPENDENCIES: CONTRACT-014.1
# ALLOWED FILES: product/packages/contracts/src/project-domain/membership.ts, product/packages/contracts/src/project-domain/index.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Define the `Membership` entity — a User's membership in a project.

## REQUIRED IMPLEMENTATION

Create the file `product/packages/contracts/src/project-domain/membership.ts`:

```typescript
import { z } from 'zod';
import { ProjectIdSchema } from '../identity/project-id';
import { UserIdSchema } from '../identity/user-id';
import { DeviceIdSchema } from '../identity/device-id';
import { MembershipStateSchema } from '../domain/membership-state';
import { TimestampSchema } from '../time/timestamp';

/**
 * A user's membership in a project.
 *
 * Note: `currentRole` is the user's CURRENT role. The Admin can change this.
 * Permission grants are computed from the role at evaluation time.
 */
export const MembershipSchema = z.object({
  membershipId: z.string().uuid(),
  projectId: ProjectIdSchema,
  userId: UserIdSchema,
  currentRole: z.string().min(1).max(64),
  state: MembershipStateSchema,
  joinedAt: TimestampSchema,
  approvedAt: TimestampSchema.optional(),
  approvedByUserId: UserIdSchema.optional(),
  removedAt: TimestampSchema.optional(),
  removedByUserId: UserIdSchema.optional(),
  removedReason: z.string().optional(),
  // Per-membership device limit (1 for plan 1, 2 for plans 2/3, etc.)
  maxDevices: z.number().int().min(1).max(10).default(2),
});

export type Membership = z.infer<typeof MembershipSchema>;
```

Update `product/packages/contracts/src/project-domain/index.ts` to add exports.

## TESTS

```bash
cd product
test -f packages/contracts/src/project-domain/membership.ts || { echo "FAIL"; exit 1; }
grep -q "maxDevices" packages/contracts/src/project-domain/membership.ts || { echo "FAIL"; exit 1; }
pnpm --filter @product/contracts typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
