# TASK ID: CLOUD-005.3
# TITLE: Define roles and permissions schema
# STATUS: pending
# DEPENDENCIES: CLOUD-005.2
# ALLOWED FILES: platform-cloud/apps/api/src/db/schema/roles.ts, platform-cloud/apps/api/src/db/schema/index.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Define the `roles` and `role_permissions` tables — project-scoped RBAC.

## REQUIRED IMPLEMENTATION

Create `platform-cloud/apps/api/src/db/schema/roles.ts`:

```typescript
import { pgTable, uuid, varchar, timestamp, boolean, index, text, primaryKey } from 'drizzle-orm/pg-core';
import { projects } from './projects';

export const roles = pgTable(
  'roles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 64 }).notNull(),
    displayName: varchar('display_name', { length: 128 }).notNull(),
    isBuiltIn: boolean('is_built_in').notNull().default(false),
    description: text('description'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    projectNameIdx: index('roles_project_name_idx').on(t.projectId, t.name),
  }),
);

export type RoleRow = typeof roles.$inferSelect;
export type RoleInsert = typeof roles.$inferInsert;

export const rolePermissions = pgTable(
  'role_permissions',
  {
    roleId: uuid('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
    permission: varchar('permission', { length: 128 }).notNull(),
    scope: text('scope'), // future: row-level scope
    grantedAt: timestamp('granted_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.roleId, t.permission] }),
  }),
);

export type RolePermissionRow = typeof rolePermissions.$inferSelect;
export type RolePermissionInsert = typeof rolePermissions.$inferInsert;
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
```

## TESTS

```bash
cd platform-cloud
test -f apps/api/src/db/schema/roles.ts || { echo "FAIL"; exit 1; }
grep -q "rolePermissions" apps/api/src/db/schema/roles.ts || { echo "FAIL"; exit 1; }
pnpm --filter @cloud/api typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
