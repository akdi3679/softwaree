import { pgTable, uuid, varchar, timestamp, index } from 'drizzle-orm/pg-core';
import { users } from './users';

export const projects = pgTable(
  'projects',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id').notNull().unique().defaultRandom(),
    ownerUserId: uuid('owner_user_id').notNull().references(() => users.id),
    name: varchar('name', { length: 256 }).notNull(),
    businessType: varchar('business_type', { length: 64 }).notNull(),
    planId: uuid('plan_id').notNull(),
    state: varchar('state', { length: 32 }).notNull().default('creating'),
    currentAdminDeviceId: uuid('current_admin_device_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    activatedAt: timestamp('activated_at', { withTimezone: true }),
    suspendedAt: timestamp('suspended_at', { withTimezone: true }),
    archivedAt: timestamp('archived_at', { withTimezone: true }),
    archivedRetentionUntil: timestamp('archived_retention_until', { withTimezone: true }),
  },
  (t) => ({
    projectIdIdx: index('projects_project_id_idx').on(t.projectId),
    ownerIdx: index('projects_owner_idx').on(t.ownerUserId),
  }),
);

export type ProjectRow = typeof projects.$inferSelect;
export type ProjectInsert = typeof projects.$inferInsert;
