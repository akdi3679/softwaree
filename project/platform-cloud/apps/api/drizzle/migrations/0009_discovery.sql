CREATE TABLE IF NOT EXISTS discovery_heartbeats (
  device_id varchar(64) PRIMARY KEY,
  virtual_ip varchar(32) NOT NULL,
  current_public_ip varchar(64),
  current_public_port integer,
  current_ipv6 varchar(64),
  state varchar(16) NOT NULL DEFAULT 'unknown',
  reachable_methods jsonb NOT NULL DEFAULT '[]'::jsonb,
  last_seen_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS discovery_heartbeats_virtual_ip_idx
  ON discovery_heartbeats(virtual_ip);

CREATE INDEX IF NOT EXISTS discovery_heartbeats_last_seen_idx
  ON discovery_heartbeats(last_seen_at);