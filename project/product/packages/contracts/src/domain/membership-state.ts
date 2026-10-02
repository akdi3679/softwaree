import { z } from 'zod';

/**
 * Membership lifecycle states.
 *
 *  PENDING_INVITATION ? PENDING_APPROVAL ? ACTIVE ? (SUSPENDED | REMOVED)
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
