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
    scope: text('scope'),
    grantedAt: timestamp('granted_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.roleId, t.permission] }),
  }),
);

export type RolePermissionRow = typeof rolePermissions.$inferSelect;
export type RolePermissionInsert = typeof rolePermissions.$inferInsert;
