ALTER TABLE "accounts"
  ADD COLUMN IF NOT EXISTS "region" varchar(16) NOT NULL DEFAULT 'us';
CREATE INDEX IF NOT EXISTS "accounts_region_idx" ON "accounts" ("region");