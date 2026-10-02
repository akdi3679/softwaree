import { pgTable, uuid, varchar, timestamp, index } from 'drizzle-orm/pg-core';
import { users } from './users';
import { projects } from './projects';

export const invitations = pgTable(
  'invitations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    invitationId: uuid('invitation_id').notNull().unique().defaultRandom(),
    projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
    invitedByUserId: uuid('invited_by_user_id').notNull().references(() => users.id),
    invitedEmail: varchar('invited_email', { length: 256 }).notNull(),
    tokenHash: varchar('token_hash', { length: 128 }).notNull().unique(),
    initialRole: varchar('initial_role', { length: 64 }).notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    acceptedAt: timestamp('accepted_at', { withTimezone: true }),
    acceptedByUserId: uuid('accepted_by_user_id').references(() => users.id),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    revokedReason: varchar('revoked_reason', { length: 256 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    tokenHashIdx: index('invitations_token_hash_idx').on(t.tokenHash),
    projectIdx: index('invitations_project_idx').on(t.projectId),
    emailIdx: index('invitations_email_idx').on(t.invitedEmail),
    expiresIdx: index('invitations_expires_idx').on(t.expiresAt),
  }),
);

export type InvitationRow = typeof invitations.$inferSelect;
export type InvitationInsert = typeof invitations.$inferInsert;
