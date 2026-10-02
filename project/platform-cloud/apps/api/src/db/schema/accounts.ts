import { pgTable, text, timestamp, uuid, varchar, index } from "drizzle-orm/pg-core";

export const accounts = pgTable(
  "accounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    primaryUserId: uuid("primary_user_id").notNull().unique(),
    email: varchar("email", { length: 256 }).notNull().unique(),
    emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
    displayName: varchar("display_name", { length: 256 }).notNull(),
    status: varchar("status", { length: 32 }).notNull().default("active"),
    passwordHash: text("password_hash"),
    totpSecret: varchar("totp_secret", { length: 64 }),
    totpEnabledAt: timestamp("totp_enabled_at", { withTimezone: true }),
    webauthnCredentials: text("webauthn_credentials"),
    plan: varchar("plan", { length: 32 }).notNull().default("local"),
    planRenewsAt: timestamp("plan_renews_at", { withTimezone: true }),
    stripeCustomerId: varchar("stripe_customer_id", { length: 64 }),
    stripeSubscriptionId: varchar("stripe_subscription_id", { length: 64 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),

    region: varchar("region", { length: 16 }).notNull().default("us"),
  },
  (t) => ({
    emailIdx: index("accounts_email_idx").on(t.email),
    statusIdx: index("accounts_status_idx").on(t.status),
    stripeCustomerIdx: index("accounts_stripe_customer_idx").on(t.stripeCustomerId),
  }),
);

export type AccountRow = typeof accounts.$inferSelect;
export type AccountInsert = typeof accounts.$inferInsert;
