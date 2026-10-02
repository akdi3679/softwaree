import { z } from 'zod';
import { ProjectIdSchema } from '../identity/project-id';
import { UserIdSchema } from '../identity/user-id';
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
  maxDevices: z.number().int().min(1).max(10).default(2),
});

export type Membership = z.infer<typeof MembershipSchema>;
