import { pgTable, uuid, varchar, text, integer, timestamp, boolean, index, jsonb } from 'drizzle-orm/pg-core';

export const modules = pgTable(
  'modules',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    moduleId: varchar('module_id', { length: 64 }).notNull().unique(),
    name: varchar('name', { length: 128 }).notNull(),
    description: text('description').notNull().default(''),
    isOfficial: boolean('is_official').notNull().default(true),
    isListed: boolean('is_listed').notNull().default(true),
    category: varchar('category', { length: 32 }).notNull().default('other'),
    minPlan: varchar('min_plan', { length: 32 }).notNull().default('starter'),
    priceCents: integer('price_cents').notNull().default(0),
    publisherId: uuid('publisher_id'),
    reviewStatus: varchar('review_status', { length: 32 }).notNull().default('published'),
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
    version: varchar('version', { length: 32 }).notNull(),
    minCoreVersion: varchar('min_core_version', { length: 32 }).notNull(),
    minAppVersion: varchar('min_app_version', { length: 32 }).notNull(),
    requiredPermissions: jsonb('required_permissions').$type<string[]>().notNull().default([]),
    providedCommands: jsonb('provided_commands').$type<string[]>().notNull().default([]),
    providedEvents: jsonb('provided_events').$type<string[]>().notNull().default([]),
    providedQueries: jsonb('provided_queries').$type<string[]>().notNull().default([]),
    capabilities: jsonb('capabilities').$type<string[]>().notNull().default([]),
    binarySizeBytes: integer('binary_size_bytes').notNull(),
    sha256: varchar('sha256', { length: 64 }).notNull(),
    packagePath: varchar('package_path', { length: 512 }).notNull(),
    manifest: jsonb('manifest').notNull(),
    signatures: jsonb('signatures').$type<{ cloud_root: { signature: string; public_key: string; algorithm: string; signed_at: string }; project_license: { signature: string; project_id: string; plan_id: string; algorithm: string; signed_at: string }; device_bind: { signature: string; device_id: string; algorithm: string; signed_at: string } }>().notNull().default({ cloud_root: { signature: '', public_key: '', algorithm: 'ed25519', signed_at: '' }, project_license: { signature: '', project_id: '', plan_id: '', algorithm: 'ed25519', signed_at: '' }, device_bind: { signature: '', device_id: '', algorithm: 'hmac-sha256', signed_at: '' } }),
    publishedAt: timestamp('published_at', { withTimezone: true }).notNull().defaultNow(),
    deprecatedAt: timestamp('deprecated_at', { withTimezone: true }),
    reviewStatus: varchar('review_status', { length: 32 }).notNull().default('published'),
    reviewReason: text('review_reason'),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    reviewerId: uuid('reviewer_id'),
  },
  (t) => ({
    moduleVersionIdx: index('module_versions_module_version_idx').on(t.moduleId, t.version),
  }),
);

export type ModuleVersionRow = typeof moduleVersions.$inferSelect;
export type ModuleVersionInsert = typeof moduleVersions.$inferInsert;
