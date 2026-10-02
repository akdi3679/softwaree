import { z } from 'zod';
import { TimestampSchema } from '../time/timestamp';

/**
 * A subscription plan.
 *
 * The Cloud has 4 built-in plans. Plans are immutable once created;
 * changing a plan is a new plan record.
 *
 * `entitlements` describes what the plan allows.
 */
export const PlanTier = {
  LOCAL: 'local',
  STARTER: 'starter',
  TEAM: 'team',
  ENTERPRISE: 'enterprise',
} as const;

export type PlanTier = (typeof PlanTier)[keyof typeof PlanTier];

export const PlanEntitlementsSchema = z.object({
  maxProjects: z.number().int().min(1),
  maxUsersPerProject: z.number().int().min(0),
  backupEnabled: z.boolean(),
  backupScheduleCron: z.string().optional(),
  backupStorageBytes: z.number().int().min(0),
  manualBackupEnabled: z.boolean(),
  customModulesEnabled: z.boolean(),
  auditRetentionDays: z.number().int().min(0),
  multiAdminAllowed: z.boolean(),
  maxDevicesPerUser: z.number().int().min(1).max(2).default(2),
});

export type PlanEntitlements = z.infer<typeof PlanEntitlementsSchema>;

export const PlanSchema = z.object({
  planId: z.string().uuid(),
  tier: z.nativeEnum(PlanTier),
  name: z.string().min(1).max(128),
  description: z.string(),
  pricePerMonthCents: z.number().int().min(0),
  currency: z.string().length(3).default('USD'),
  entitlements: PlanEntitlementsSchema,
  isActive: z.boolean().default(true),
  createdAt: TimestampSchema,
  deprecatedAt: TimestampSchema.optional(),
});

export type Plan = z.infer<typeof PlanSchema>;
