import { z } from 'zod';
import { ProjectIdSchema } from '../identity/project-id';
import { UserIdSchema } from '../identity/user-id';
import { DeviceIdSchema } from '../identity/device-id';
import { ProjectStateSchema } from '../domain/project-state';
import { TimestampSchema } from '../time/timestamp';

/**
 * A project in the Cloud.
 *
 * Each project has:
 *  - one owner (account)
 *  - one Admin device (current, can be replaced)
 *  - one plan
 *  - N memberships
 *  - one business_type (e.g., "medical", "food-lab", future)
 */
export const BusinessType = {
  MEDICAL_RECEPTION: 'medical_reception',
  FOOD_LAB: 'food_lab',
  OTHER: 'other',
} as const;

export type BusinessType = (typeof BusinessType)[keyof typeof BusinessType];

export const ProjectSchema = z.object({
  projectId: ProjectIdSchema,
  ownerUserId: UserIdSchema,
  name: z.string().min(1).max(256),
  businessType: z.nativeEnum(BusinessType),
  planId: z.string().uuid(),
  state: ProjectStateSchema,
  currentAdminDeviceId: DeviceIdSchema.optional(),
  createdAt: TimestampSchema,
  activatedAt: TimestampSchema.optional(),
  suspendedAt: TimestampSchema.optional(),
  archivedAt: TimestampSchema.optional(),
  archivedRetentionUntil: TimestampSchema.optional(),
});

export type Project = z.infer<typeof ProjectSchema>;
