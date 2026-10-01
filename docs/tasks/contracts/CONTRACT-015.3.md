# TASK ID: CONTRACT-015.3
# TITLE: Define built-in plan seed data
# STATUS: pending
# DEPENDENCIES: CONTRACT-015.2
# ALLOWED FILES: product/packages/contracts/src/plan-domain/built-in-plans.ts, product/packages/contracts/src/plan-domain/index.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Define the 4 built-in plan entitlements as constants. Used to seed the Cloud's plans table on first run.

## REQUIRED IMPLEMENTATION

Create the file `product/packages/contracts/src/plan-domain/built-in-plans.ts`:

```typescript
import { PlanEntitlementsSchema, type PlanEntitlements, PlanTier } from './plan';
import { z } from 'zod';

/**
 * The 4 built-in plans, with their entitlements.
 *
 * These are seeded into the Cloud's `plans` table on first run.
 * IDs are stable (UUIDv5) so clients can reference them.
 */

export const BUILT_IN_PLANS = {
  [PlanTier.LOCAL]: PlanEntitlementsSchema.parse({
    maxProjects: 1,
    maxUsersPerProject: 0, // no other users
    backupEnabled: false,
    backupStorageBytes: 0,
    manualBackupEnabled: false,
    customModulesEnabled: false,
    auditRetentionDays: 0, // local only
    multiAdminAllowed: false,
    maxDevicesPerUser: 1,
  }),
  [PlanTier.STARTER]: PlanEntitlementsSchema.parse({
    maxProjects: 1,
    maxUsersPerProject: 3,
    backupEnabled: true,
    backupScheduleCron: '0 2 * * *', // 2 AM daily
    backupStorageBytes: 50 * 1024 * 1024 * 1024, // 50 GB
    manualBackupEnabled: false,
    customModulesEnabled: false,
    auditRetentionDays: 365, // 1 year
    multiAdminAllowed: false,
    maxDevicesPerUser: 2,
  }),
  [PlanTier.TEAM]: PlanEntitlementsSchema.parse({
    maxProjects: 1,
    maxUsersPerProject: 10,
    backupEnabled: true,
    backupScheduleCron: '0 2 * * *',
    backupStorageBytes: 500 * 1024 * 1024 * 1024, // 500 GB
    manualBackupEnabled: false,
    customModulesEnabled: false,
    auditRetentionDays: 1825, // 5 years
    multiAdminAllowed: false,
    maxDevicesPerUser: 2,
  }),
  [PlanTier.ENTERPRISE]: PlanEntitlementsSchema.parse({
    maxProjects: 100, // effectively unlimited
    maxUsersPerProject: 1000,
    backupEnabled: true,
    backupScheduleCron: '0 2 * * *',
    backupStorageBytes: 5 * 1024 * 1024 * 1024 * 1024, // 5 TB
    manualBackupEnabled: true,
    manualBackupMonthlyLimit: 10,
    manualBackupSizeLimitBytes: 10 * 1024 * 1024 * 1024, // 10 GB per manual backup
    manualBackupTotalQuotaBytes: 100 * 1024 * 1024 * 1024, // 100 GB total manual storage
    backupAdminChoosesTime: true, // admin picks the time (00:00-06:00 local)
    customModulesEnabled: true,
    auditRetentionDays: -1, // forever
    multiAdminAllowed: false, // still single admin per project
    maxDevicesPerUser: 2,
  }),
} as const satisfies Record<PlanTier, PlanEntitlements>;
```

Update `product/packages/contracts/src/plan-domain/index.ts` to add the export.

## TESTS

```bash
cd product
test -f packages/contracts/src/plan-domain/built-in-plans.ts || { echo "FAIL"; exit 1; }
grep -q "BUILT_IN_PLANS" packages/contracts/src/plan-domain/built-in-plans.ts || { echo "FAIL"; exit 1; }
pnpm --filter @product/contracts typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
