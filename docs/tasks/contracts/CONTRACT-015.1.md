# TASK ID: CONTRACT-015.1
# TITLE: Define Plan entity
# STATUS: pending
# DEPENDENCIES: CONTRACT-014.5
# ALLOWED FILES: product/packages/contracts/src/plan-domain/plan.ts, product/packages/contracts/src/plan-domain/index.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Define the `Plan` entity — the Cloud's record of subscription plans.

## REQUIRED IMPLEMENTATION

```bash
mkdir -p product/packages/contracts/src/plan-domain
```

Create the file `product/packages/contracts/src/plan-domain/plan.ts`:

```typescript
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
  maxProjects: z.number().int().min(1), // 1 for local/starter/team, unlimited for enterprise
  maxUsersPerProject: z.number().int().min(0), // 0 for local
  backupEnabled: z.boolean(),
  backupScheduleCron: z.string().optional(), // e.g., "0 2 * * *"
  backupStorageBytes: z.number().int().min(0), // 0 = no backup
  manualBackupEnabled: z.boolean(),
  customModulesEnabled: z.boolean(),
  auditRetentionDays: z.number().int().min(0),
  multiAdminAllowed: z.boolean(), // always false in v1
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
```

Create `product/packages/contracts/src/plan-domain/index.ts`:

```typescript
export { PlanTier } from './plan';
export type { PlanTier as PlanTierValue, PlanEntitlements, Plan } from './plan';
export { PlanEntitlementsSchema, PlanSchema } from './plan';
```

## TESTS

```bash
cd product
test -f packages/contracts/src/plan-domain/plan.ts || { echo "FAIL"; exit 1; }
grep -q "LOCAL\|STARTER\|TEAM\|ENTERPRISE" packages/contracts/src/plan-domain/plan.ts || { echo "FAIL: no tiers"; exit 1; }
pnpm --filter @product/contracts typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
