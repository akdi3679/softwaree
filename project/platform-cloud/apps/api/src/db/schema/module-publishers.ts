import { pgTable, uuid, varchar, text, timestamp, boolean, index } from "drizzle-orm/pg-core";

export const modulePublishers = pgTable(
  "module_publishers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: varchar("slug", { length: 64 }).notNull().unique(),
    displayName: varchar("display_name", { length: 128 }).notNull(),
    contactEmail: varchar("contact_email", { length: 256 }).notNull(),
    website: varchar("website", { length: 256 }),
    verified: boolean("verified").notNull().default(false),
    suspendedAt: timestamp("suspended_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    slugIdx: index("module_publishers_slug_idx").on(t.slug),
  }),
);

export type ModulePublisherRow = typeof modulePublishers.$inferSelect;
export type ModulePublisherInsert = typeof modulePublishers.$inferInsert;