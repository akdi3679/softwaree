ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS totp_secret varchar(64),
  ADD COLUMN IF NOT EXISTS totp_enabled_at timestamptz;