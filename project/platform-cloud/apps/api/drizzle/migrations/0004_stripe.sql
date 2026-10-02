ALTER TABLE "accounts"
  ADD COLUMN IF NOT EXISTS "plan" varchar(32) NOT NULL DEFAULT 'local',
  ADD COLUMN IF NOT EXISTS "plan_renews_at" timestamptz,
  ADD COLUMN IF NOT EXISTS "stripe_customer_id" varchar(64),
  ADD COLUMN IF NOT EXISTS "stripe_subscription_id" varchar(64);

CREATE INDEX IF NOT EXISTS "accounts_stripe_customer_idx" ON "accounts" ("stripe_customer_id");

CREATE TABLE IF NOT EXISTS "stripe_events" (
  "id" varchar(64) PRIMARY KEY,
  "type" varchar(128) NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "stripe_events_type_idx" ON "stripe_events" ("type");
