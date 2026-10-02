CREATE TABLE IF NOT EXISTS idempotency_keys (
  command_id TEXT PRIMARY KEY,
  payload_json TEXT NOT NULL,
  response_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
