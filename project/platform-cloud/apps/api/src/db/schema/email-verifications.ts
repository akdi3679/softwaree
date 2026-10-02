import { pgTable, uuid, varchar, timestamp, index } from "drizzle-orm/pg-core";

export const emailVerifications = pgTable(
  "email_verifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    accountId: uuid("account_id").notNull(),
    tokenHash: varchar("token_hash", { length: 128 }).notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    consumedAt: timestamp("consumed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    accountIdx: index("email_verifications_account_idx").on(t.accountId),
    tokenIdx: index("email_verifications_token_idx").on(t.tokenHash),
  }),
);

export type EmailVerificationRow = typeof emailVerifications.$inferSelect;
export type EmailVerificationInsert = typeof emailVerifications.$inferInsert;