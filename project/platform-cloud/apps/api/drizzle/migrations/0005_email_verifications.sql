CREATE TABLE IF NOT EXISTS "email_verifications" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "account_id" uuid NOT NULL,
  "token_hash" varchar(128) NOT NULL UNIQUE,
  "expires_at" timestamptz NOT NULL,
  "consumed_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "email_verifications_account_idx" ON "email_verifications" ("account_id");
CREATE INDEX IF NOT EXISTS "email_verifications_token_idx" ON "email_verifications" ("token_hash");