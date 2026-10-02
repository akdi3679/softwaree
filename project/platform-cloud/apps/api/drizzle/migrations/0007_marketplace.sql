-- Marketplace extension
CREATE TABLE IF NOT EXISTS "module_publishers" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "slug" varchar(64) NOT NULL UNIQUE,
  "display_name" varchar(128) NOT NULL,
  "contact_email" varchar(256) NOT NULL,
  "website" varchar(256),
  "verified" boolean NOT NULL DEFAULT false,
  "suspended_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "module_publishers_slug_idx" ON "module_publishers" ("slug");

ALTER TABLE "modules"
  ADD COLUMN IF NOT EXISTS "category" varchar(32) NOT NULL DEFAULT 'other',
  ADD COLUMN IF NOT EXISTS "min_plan" varchar(32) NOT NULL DEFAULT 'starter',
  ADD COLUMN IF NOT EXISTS "price_cents" integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "publisher_id" uuid,
  ADD COLUMN IF NOT EXISTS "review_status" varchar(32) NOT NULL DEFAULT 'published';

ALTER TABLE "module_versions"
  ADD COLUMN IF NOT EXISTS "review_status" varchar(32) NOT NULL DEFAULT 'published',
  ADD COLUMN IF NOT EXISTS "review_reason" text,
  ADD COLUMN IF NOT EXISTS "reviewed_at" timestamptz,
  ADD COLUMN IF NOT EXISTS "reviewer_id" uuid;