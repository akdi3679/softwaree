import { z } from 'zod';
import { UserIdSchema } from '../identity/user-id';

/**
 * A customer account in the Cloud.
 *
 * An account can own multiple projects (Plan 4) and can be the
 * "account owner" for billing. The account's user (UserId) is the
 * first user that registered; this is the "primary" user.
 */
export const AccountStatus = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  DELETED: 'deleted',
} as const;

export type AccountStatus = (typeof AccountStatus)[keyof typeof AccountStatus];

export const AccountSchema = z.object({
  userId: UserIdSchema,
  email: z.string().email(),
  displayName: z.string().min(1).max(256),
  status: z.nativeEnum(AccountStatus),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  lastLoginAt: z.string().datetime().optional(),
  emailVerifiedAt: z.string().datetime().optional(),
});

export type Account = z.infer<typeof AccountSchema>;
