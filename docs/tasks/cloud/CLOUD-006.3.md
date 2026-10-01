# TASK ID: CLOUD-006.3
# TITLE: Define platform audit schema
# STATUS: pending
# DEPENDENCIES: CLOUD-006.2
# ALLOWED FILES: platform-cloud/apps/api/src/db/schema/audit.ts, platform-cloud/apps/api/src/db/schema/index.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Define the `audit_entries` table — Cloud's platform audit log (auth events, billing events, security events).

## REQUIRED IMPLEMENTATION

Create `platform-cloud/apps/api/src/db/schema/audit.ts`:

```typescript
import { pgTable, uuid, varchar, text, timestamp, index, jsonb, inet } from 'drizzle-orm/pg-core';

export const auditEntries = pgTable(
  'audit_entries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
    // Category
    category: varchar('category', { length: 32 }).notNull(), // auth / device / project / billing / security
    // Action
    action: varchar('action', { length: 64 }).notNull(), // e.g., "auth.login", "device.registered"
    // Actor
    actorUserId: uuid('actor_user_id'),
    actorDeviceId: uuid('actor_device_id'),
    actorIp: inet('actor_ip'),
    // Target
    targetType: varchar('target_type', { length: 32 }), // e.g., "account", "device", "project"
    targetId: varchar('target_id', { length: 128 }),
    // Project (if relevant)
    projectId: uuid('project_id'),
    // Result
    result: varchar('result', { length: 32 }).notNull(), // success / failure / denied
    // Hash chain
    prevHash: varchar('prev_hash', { length: 64 }).notNull(),
    entryHash: varchar('entry_hash', { length: 64 }).notNull(),
    // Free-form details
    details: jsonb('details').$type<Record<string, unknown>>().default({}),
  },
  (t) => ({
    categoryIdx: index('audit_category_idx').on(t.category),
    actorIdx: index('audit_actor_idx').on(t.actorUserId),
    targetIdx: index('audit_target_idx').on(t.targetType, t.targetId),
    projectIdx: index('audit_project_idx').on(t.projectId),
    occurredIdx: index('audit_occurred_idx').on(t.occurredAt),
  }),
);

export type AuditEntryRow = typeof auditEntries.$inferSelect;
export type AuditEntryInsert = typeof auditEntries.$inferInsert;
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
export * from './modules';
export * from './audit';
```

## TESTS

```bash
cd platform-cloud
test -f apps/api/src/db/schema/audit.ts || { echo "FAIL"; exit 1; }
grep -q "entryHash" apps/api/src/db/schema/audit.ts || { echo "FAIL: no chain hash"; exit 1; }
pnpm --filter @cloud/api typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
