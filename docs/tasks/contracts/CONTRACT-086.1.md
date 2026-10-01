# TASK ID: CONTRACT-086.1
# TITLE: Add contract: type-safe configuration for plans
# STATUS: pending
# DEPENDENCIES: ADMIN-036.2
# ALLOWED FILES: product/contracts/src/billing/plans.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Type-safe plan definitions. Used by both Cloud and Tauri apps.

## REQUIRED IMPLEMENTATION

Create `product/contracts/src/billing/plans.ts`:

```typescript
export type PlanId = 'local' | 'starter' | 'team' | 'enterprise';

export interface Plan {
  id: PlanId;
  name: string;
  monthly_price_cents: number;
  max_projects: number;
  max_users_per_project: number;
  max_admin_devices: number;
  backup_cadence_hours: number;        // 0 = none
  storage_quota_gb: number;            // 0 = none
  module_marketplace: boolean;
  custom_modules: boolean;
  multi_admin: boolean;                // v2
  priority_support: boolean;
  features: string[];
}

export const PLANS: Record<PlanId, Plan> = {
  local: {
    id: 'local', name: 'Local', monthly_price_cents: 0,
    max_projects: 1, max_users_per_project: 0, max_admin_devices: 1,
    backup_cadence_hours: 0, storage_quota_gb: 0,
    module_marketplace: false, custom_modules: false, multi_admin: false, priority_support: false,
    features: ['local-only', 'single-admin'],
  },
  starter: {
    id: 'starter', name: 'Starter', monthly_price_cents: 2900,
    max_projects: 1, max_users_per_project: 3, max_admin_devices: 1,
    backup_cadence_hours: 168, storage_quota_gb: 5,
    module_marketplace: true, custom_modules: false, multi_admin: false, priority_support: false,
    features: ['weekly-backup', 'marketplace'],
  },
  team: {
    id: 'team', name: 'Team', monthly_price_cents: 9900,
    max_projects: 5, max_users_per_project: 10, max_admin_devices: 1,
    backup_cadence_hours: 24, storage_quota_gb: 50,
    module_marketplace: true, custom_modules: false, multi_admin: false, priority_support: true,
    features: ['daily-backup', 'marketplace', 'priority-support'],
  },
  enterprise: {
    id: 'enterprise', name: 'Enterprise', monthly_price_cents: 49900,
    max_projects: 999, max_users_per_project: 999, max_admin_devices: 5,
    backup_cadence_hours: 4, storage_quota_gb: 5000,
    module_marketplace: true, custom_modules: true, multi_admin: true, priority_support: true,
    features: ['4h-backup', 'marketplace', 'custom-modules', 'multi-admin', 'priority-support', 'sso-saml'],
  },
};

export function plan(id: PlanId): Plan {
  return PLANS[id];
}

export function isFeatureAvailable(planId: PlanId, feature: string): boolean {
  return PLANS[planId].features.includes(feature);
}
```

## TESTS

```bash
cd product
test -f contracts/src/billing/plans.ts || { echo "FAIL"; exit 1; }
grep -q "PLANS" contracts/src/billing/plans.ts || { echo "FAIL"; exit 1; }
echo "OK"
```
