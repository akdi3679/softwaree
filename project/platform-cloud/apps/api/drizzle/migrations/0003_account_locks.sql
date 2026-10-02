CREATE TABLE IF NOT EXISTS "account_locks" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "email" varchar(256) NOT NULL,
  "ip" varchar(64) NOT NULL,
  "locked_until" timestamptz NOT NULL,
  "failed_count" integer NOT NULL DEFAULT 0,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "account_locks_email_ip_idx" ON "account_locks" ("email", "ip");
