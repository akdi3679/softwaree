# TASK ID: CLOUD-006.1
# TITLE: Define plan and subscription schemas
# STATUS: pending
# DEPENDENCIES: CLOUD-005.4
# ALLOWED FILES: platform-cloud/apps/api/src/db/schema/plans.ts, platform-cloud/apps/api/src/db/schema/index.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
Define the `plans` and `plan_subscriptions` tables.

## REQUIRED IMPLEMENTATION

Create `platform-cloud/apps/api/src/db/schema/plans.ts`:

```typescript
import { pgTable, uuid, varchar, integer, text, boolean, timestamp, index, jsonb } from 'drizzle-orm/pg-core';

export const plans = pgTable(
  'plans',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    planId: varchar('plan_id', { length: 64 }).notNull().unique(), // e.g., "starter", "team"
    tier: varchar('tier', { length: 32 }).notNull(), // local/starter/team/enterprise
    name: varchar('name', { length: 128 }).notNull(),
    description: text('description').notNull().default(''),
    pricePerMonthCents: integer('price_per_month_cents').notNull().default(0),
    currency: varchar('currency', { length: 3 }).notNull().default('USD'),
    entitlements: jsonb('entitlements').$type<{
      maxProjects: number;
      maxUsersPerProject: number;
      backupEnabled: boolean;
      backupScheduleCron?: string;
      backupStorageBytes: number;
      manualBackupEnabled: boolean;
      customModulesEnabled: boolean;
      auditRetentionDays: number;
      multiAdminAllowed: boolean;
      maxDevicesPerUser: number;
    }>().notNull(),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    deprecatedAt: timestamp('deprecated_at', { withTimezone: true }),
  },
  (t) => ({
    planIdIdx: index('plans_plan_id_idx').on(t.planId),
  }),
);

export type PlanRow = typeof plans.$inferSelect;
export type PlanInsert = typeof plans.$inferInsert;

export const planSubscriptions = pgTable(
  'plan_subscriptions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id').notNull(), // references projects.id but kept loose for migration
    planId: uuid('plan_id').notNull().references(() => plans.id),
    status: varchar('status', { length: 32 }).notNull().default('active'),
    startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
    endedAt: timestamp('ended_at', { withTimezone: true }),
    supersededBy: uuid('superseded_by'),
    currentPeriodStart: timestamp('current_period_start', { withTimezone: true }).notNull().defaultNow(),
    currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }).notNull(),
    cancelAtPeriodEnd: boolean('cancel_at_period_end').notNull().default(false),
  },
  (t) => ({
    projectIdx: index('plan_subscriptions_project_idx').on(t.projectId),
    planIdx: index('plan_subscriptions_plan_idx').on(t.planId),
    statusIdx: index('plan_subscriptions_status_idx').on(t.status),
  }),
);

export type PlanSubscriptionRow = typeof planSubscriptions.$inferSelect;
export type PlanSubscriptionInsert = typeof planSubscriptions.$inferInsert;
```

Update `platform-cloud/apps/api/src/db/schema/index.ts`:

```typescript
export * from './accounts';
export * from './users';
export * from './devices';
export * from './sessions';
export * from './invitations';
export * from './projects';
export * from './memberships';
export * from './roles';
export * from './plans';
```

## TESTS

```bash
cd platform-cloud
test -f apps/api/src/db/schema/plans.ts || { echo "FAIL"; exit 1; }
grep -q "planSubscriptions" apps/api/src/db/schema/plans.ts || { echo "FAIL"; exit 1; }
pnpm --filter @cloud/api typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
