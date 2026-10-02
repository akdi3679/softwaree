import { z } from 'zod';
import { ProjectIdSchema } from '../identity/project-id';
import { TimestampSchema } from '../time/timestamp';

/**
 * A project's current subscription to a plan.
 *
 * Plan changes are recorded as new subscription records, with `supersededBy`
 * linking them.
 */
export const SubscriptionStatus = {
  ACTIVE: 'active',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired',
} as const;

export type SubscriptionStatus = (typeof SubscriptionStatus)[keyof typeof SubscriptionStatus];

export const PlanSubscriptionSchema = z.object({
  subscriptionId: z.string().uuid(),
  projectId: ProjectIdSchema,
  planId: z.string().uuid(),
  status: z.nativeEnum(SubscriptionStatus),
  startedAt: TimestampSchema,
  endedAt: TimestampSchema.optional(),
  supersededBy: z.string().uuid().optional(),
  currentPeriodStart: TimestampSchema,
  currentPeriodEnd: TimestampSchema,
  cancelAtPeriodEnd: z.boolean().default(false),
});

export type PlanSubscription = z.infer<typeof PlanSubscriptionSchema>;
