import { and, eq } from 'drizzle-orm';
import { db } from '../db/client';
import { memberships } from '../db/schema';
import { HttpError } from '../middleware/error';
import { ErrorCategory } from '@product/contracts';

export async function approveMembership(membershipId: string, approvedByUserId: string) {
  const result = await db
    .update(memberships)
    .set({ state: 'active', approvedAt: new Date(), approvedByUserId })
    .where(and(eq(memberships.id, membershipId), eq(memberships.state, 'pending_approval')))
    .returning();
  if (result.length === 0) {
    throw new HttpError(404, ErrorCategory.NOT_FOUND, 'MEMBERSHIP_NOT_PENDING', 'Membership not found or not pending');
  }
  return result[0];
}

export async function changeRole(membershipId: string, newRole: string, changedByUserId: string) {
  const existing = await db.select().from(memberships).where(eq(memberships.id, membershipId)).limit(1);
  if (existing.length === 0) {
    throw new HttpError(404, ErrorCategory.NOT_FOUND, 'MEMBERSHIP_NOT_FOUND', 'Membership not found');
  }
  await db
    .update(memberships)
    .set({ currentRole: newRole, approvedByUserId: changedByUserId })
    .where(eq(memberships.id, membershipId));
  const [updated] = await db.select().from(memberships).where(eq(memberships.id, membershipId)).limit(1);
  return updated;
}

export async function removeMembership(membershipId: string, removedByUserId: string, reason: string) {
  await db
    .update(memberships)
    .set({ state: 'removed', removedAt: new Date(), removedByUserId, removedReason: reason })
    .where(eq(memberships.id, membershipId));
}

export async function listMembershipsForProject(projectId: string) {
  return db.select().from(memberships).where(eq(memberships.projectId, projectId));
}

export async function listMembershipsForUser(userId: string) {
  return db.select().from(memberships).where(eq(memberships.userId, userId));
}
