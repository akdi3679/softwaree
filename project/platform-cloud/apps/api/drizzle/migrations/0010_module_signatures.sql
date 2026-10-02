ALTER TABLE module_versions
  ADD COLUMN IF NOT EXISTS signatures jsonb NOT NULL DEFAULT '{
    "cloud_root":       {"signature":"","public_key":"","algorithm":"ed25519","signed_at":""},
    "project_license":  {"signature":"","project_id":"","plan_id":"","algorithm":"ed25519","signed_at":""},
    "device_bind":      {"signature":"","device_id":"","algorithm":"hmac-sha256","signed_at":""}
  }'::jsonb;