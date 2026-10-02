import { pgTable, uuid, varchar, timestamp, index, integer } from 'drizzle-orm/pg-core';
import { projects } from './projects';
import { users } from './users';

export const memberships = pgTable(
  'memberships',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    currentRole: varchar('current_role', { length: 64 }).notNull(),
    state: varchar('state', { length: 32 }).notNull().default('pending_invitation'),
    joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
    approvedAt: timestamp('approved_at', { withTimezone: true }),
    approvedByUserId: uuid('approved_by_user_id'),
    removedAt: timestamp('removed_at', { withTimezone: true }),
    removedByUserId: uuid('removed_by_user_id'),
    removedReason: varchar('removed_reason', { length: 256 }),
    maxDevices: integer('max_devices').notNull().default(2),
  },
  (t) => ({
    projectUserIdx: index('memberships_project_user_idx').on(t.projectId, t.userId),
    stateIdx: index('memberships_state_idx').on(t.state),
  }),
);

export type MembershipRow = typeof memberships.$inferSelect;
export type MembershipInsert = typeof memberships.$inferInsert;
