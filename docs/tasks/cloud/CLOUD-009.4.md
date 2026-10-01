# TASK ID: CLOUD-009.4
# TITLE: Create membership service
# STATUS: pending
# DEPENDENCIES: CLOUD-009.3
# ALLOWED FILES: platform-cloud/apps/api/src/services/membership.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
Create the membership service — approve, change role, remove, list.

## REQUIRED IMPLEMENTATION

Create `platform-cloud/apps/api/src/services/membership.ts`:

```typescript
import { and, eq } from 'drizzle-orm';
import { db } from '../db/client';
import { memberships } from '../db/schema';
import { HttpError } from '../middleware/error';
import { ErrorCategory } from '@product/contracts';

export async function approveMembership(membershipId: string, approvedByUserId: string) {
  const result = await db
    .update(memberships)
    .set({
      state: 'active',
      approvedAt: new Date(),
      approvedByUserId,
    })
    .where(and(eq(memberships.id, membershipId), eq(memberships.state, 'pending_approval')))
    .returning();
  if (result.length === 0) {
    throw new HttpError(404, ErrorCategory.NOT_FOUND, 'MEMBERSHIP_NOT_PENDING', 'Membership not found or not pending');
  }
  return result[0];
}

export async function changeRole(membershipId: string, newRole: string, changedByUserId: string) {
  // Verify the membership exists
  const existing = await db.select().from(memberships).where(eq(memberships.id, membershipId)).limit(1);
  if (existing.length === 0) {
    throw new HttpError(404, ErrorCategory.NOT_FOUND, 'MEMBERSHIP_NOT_FOUND', 'Membership not found');
  }
  // Don't allow removing the last owner (enforced at project level)
  // For now, allow any role change
  await db
    .update(memberships)
    .set({ currentRole: newRole, approvedByUserId: changedByUserId })
    .where(eq(memberships.id, membershipId));
  // Return updated
  const [updated] = await db.select().from(memberships).where(eq(memberships.id, membershipId)).limit(1);
  return updated;
}

export async function removeMembership(membershipId: string, removedByUserId: string, reason: string) {
  await db
    .update(memberships)
    .set({
      state: 'removed',
      removedAt: new Date(),
      removedByUserId,
      removedReason: reason,
    })
    .where(eq(memberships.id, membershipId));
}

export async function listMembershipsForProject(projectId: string) {
  return db.select().from(memberships).where(eq(memberships.projectId, projectId));
}

export async function listMembershipsForUser(userId: string) {
  return db.select().from(memberships).where(eq(memberships.userId, userId));
}
```

## TESTS

```bash
cd platform-cloud
test -f apps/api/src/services/membership.ts || { echo "FAIL"; exit 1; }
grep -q "approveMembership" apps/api/src/services/membership.ts || { echo "FAIL"; exit 1; }
pnpm --filter @cloud/api typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
