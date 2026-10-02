import { pgTable, uuid, varchar, timestamp, index, text } from 'drizzle-orm/pg-core';
import { accounts } from './accounts';

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    accountId: uuid('account_id').notNull().references(() => accounts.id, { onDelete: 'cascade' }),
    email: varchar('email', { length: 256 }).notNull().unique(),
    displayName: varchar('display_name', { length: 256 }).notNull(),
    avatarUrl: text('avatar_url'),
    locale: varchar('locale', { length: 16 }).default('en'),
    timezone: varchar('timezone', { length: 64 }).default('UTC'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    emailIdx: index('users_email_idx').on(t.email),
    accountIdx: index('users_account_idx').on(t.accountId),
  }),
);

export type UserRow = typeof users.$inferSelect;
export type UserInsert = typeof users.$inferInsert;
