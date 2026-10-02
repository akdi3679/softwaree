import { z } from 'zod';
import { ProjectIdSchema } from '../identity/project-id';
import { UserIdSchema } from '../identity/user-id';

/**
 * A pending invitation to join a project.
 *
 * The actual auth token is NOT stored — only its hash.
 * When the user accepts with the token, the system re-hashes and compares.
 */
export const InvitationSchema = z.object({
  invitationId: z.string().uuid(),
  projectId: ProjectIdSchema,
  invitedByUserId: UserIdSchema,
  invitedEmail: z.string().email(),
  tokenHash: z.string().min(64).max(128),
  initialRole: z.string().min(1).max(64),
  expiresAt: z.string().datetime(),
  acceptedAt: z.string().datetime().optional(),
  acceptedByUserId: UserIdSchema.optional(),
  revokedAt: z.string().datetime().optional(),
  revokedReason: z.string().optional(),
  createdAt: z.string().datetime(),
});

export type Invitation = z.infer<typeof InvitationSchema>;
