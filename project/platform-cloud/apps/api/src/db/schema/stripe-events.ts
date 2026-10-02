import { pgTable, varchar, timestamp, index } from "drizzle-orm/pg-core";

export const stripeEvents = pgTable(
  "stripe_events",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    type: varchar("type", { length: 128 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    typeIdx: index("stripe_events_type_idx").on(t.type),
  }),
);

export type StripeEventRow = typeof stripeEvents.$inferSelect;
export type StripeEventInsert = typeof stripeEvents.$inferInsert;
