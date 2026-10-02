CREATE TABLE IF NOT EXISTS per_table_cursor (
  table_name TEXT PRIMARY KEY,
  last_sequence INTEGER NOT NULL DEFAULT 0
);
