import { pgTable, uuid, varchar, integer, timestamp, index } from "drizzle-orm/pg-core";

export const accountLocks = pgTable(
  "account_locks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar("email", { length: 256 }).notNull(),
    ip: varchar("ip", { length: 64 }).notNull(),
    lockedUntil: timestamp("locked_until", { withTimezone: true }).notNull(),
    failedCount: integer("failed_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    emailIpIdx: index("account_locks_email_ip_idx").on(t.email, t.ip),
  }),
);

export type AccountLockRow = typeof accountLocks.$inferSelect;
export type AccountLockInsert = typeof accountLocks.$inferInsert;
