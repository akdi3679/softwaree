# TASK ID: CLOUD-006.2
# TITLE: Define module registry schema
# STATUS: pending
# DEPENDENCIES: CLOUD-006.1
# ALLOWED FILES: platform-cloud/apps/api/src/db/schema/modules.ts, platform-cloud/apps/api/src/db/schema/index.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Define the `modules` and `module_versions` tables — the Cloud's module catalog.

## REQUIRED IMPLEMENTATION

Create `platform-cloud/apps/api/src/db/schema/modules.ts`:

```typescript
import { pgTable, uuid, varchar, text, integer, timestamp, boolean, index, jsonb, primaryKey } from 'drizzle-orm/pg-core';

export const modules = pgTable(
  'modules',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    moduleId: varchar('module_id', { length: 64 }).notNull().unique(),
    name: varchar('name', { length: 128 }).notNull(),
    description: text('description').notNull().default(''),
    isOfficial: boolean('is_official').notNull().default(true), // true = us, false = third-party
    isListed: boolean('is_listed').notNull().default(true), // visible in catalog
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
);

export type ModuleRow = typeof modules.$inferSelect;
export type ModuleInsert = typeof modules.$inferInsert;

export const moduleVersions = pgTable(
  'module_versions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    moduleId: uuid('module_id').notNull().references(() => modules.id, { onDelete: 'cascade' }),
    version: varchar('version', { length: 32 }).notNull(), // semver
    minCoreVersion: varchar('min_core_version', { length: 32 }).notNull(),
    minAppVersion: varchar('min_app_version', { length: 32 }).notNull(),
    requiredPermissions: jsonb('required_permissions').$type<string[]>().notNull().default([]),
    providedCommands: jsonb('provided_commands').$type<string[]>().notNull().default([]),
    providedEvents: jsonb('provided_events').$type<string[]>().notNull().default([]),
    providedQueries: jsonb('provided_queries').$type<string[]>().notNull().default([]),
    capabilities: jsonb('capabilities').$type<string[]>().notNull().default([]),
    binarySizeBytes: integer('binary_size_bytes').notNull(),
    sha256: varchar('sha256', { length: 64 }).notNull(),
    // MinIO path of the signed package
    packagePath: varchar('package_path', { length: 512 }).notNull(),
    // Manifest as JSON
    manifest: jsonb('manifest').notNull(),
    publishedAt: timestamp('published_at', { withTimezone: true }).notNull().defaultNow(),
    deprecatedAt: timestamp('deprecated_at', { withTimezone: true }),
  },
  (t) => ({
    moduleVersionIdx: index('module_versions_module_version_idx').on(t.moduleId, t.version),
  }),
);

export type ModuleVersionRow = typeof moduleVersions.$inferSelect;
export type ModuleVersionInsert = typeof moduleVersions.$inferInsert;
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
```

## TESTS

```bash
cd platform-cloud
test -f apps/api/src/db/schema/modules.ts || { echo "FAIL"; exit 1; }
grep -q "moduleVersions" apps/api/src/db/schema/modules.ts || { echo "FAIL"; exit 1; }
pnpm --filter @cloud/api typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
