CREATE TABLE IF NOT EXISTS "cluster_nodes" (
  "instance_id" varchar(128) PRIMARY KEY,
  "started_at" timestamptz NOT NULL DEFAULT now(),
  "last_heartbeat" timestamptz NOT NULL DEFAULT now(),
  "cpu_load_1m" double precision NOT NULL DEFAULT 0,
  "version" varchar(32) NOT NULL DEFAULT '0.0.0'
);
CREATE INDEX IF NOT EXISTS "cluster_nodes_last_heartbeat_idx" ON "cluster_nodes" ("last_heartbeat");