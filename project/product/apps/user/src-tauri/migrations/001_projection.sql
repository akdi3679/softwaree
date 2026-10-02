CREATE TABLE IF NOT EXISTS projection_state (
    project_id TEXT PRIMARY KEY,
    admin_endpoint TEXT NOT NULL,
    last_applied_sequence INTEGER NOT NULL DEFAULT 0,
    snapshot_at_sequence INTEGER,
    snapshot_at TEXT,
    schema_version INTEGER NOT NULL DEFAULT 1,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS projection_events (
    sequence INTEGER PRIMARY KEY,
    event_id TEXT NOT NULL UNIQUE,
    event_type TEXT NOT NULL,
    aggregate_type TEXT NOT NULL,
    aggregate_id TEXT NOT NULL,
    aggregate_version INTEGER NOT NULL,
    actor_user_id TEXT NOT NULL,
    device_id TEXT NOT NULL DEFAULT '',
    occurred_at TEXT NOT NULL DEFAULT '',
    correlation_id TEXT,
    causation_id TEXT,
    payload TEXT NOT NULL,
    applied_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS projection_users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    display_name TEXT NOT NULL,
    state TEXT NOT NULL,
    created_at TEXT NOT NULL,
    last_event_sequence INTEGER NOT NULL,
    tombstoned_at TEXT
);

CREATE TABLE IF NOT EXISTS projection_roles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    display_name TEXT NOT NULL,
    is_built_in INTEGER NOT NULL,
    last_event_sequence INTEGER NOT NULL,
    UNIQUE(name)
);

CREATE TABLE IF NOT EXISTS projection_audit (
    id INTEGER PRIMARY KEY,
    occurred_at TEXT NOT NULL,
    actor_user_id TEXT,
    action TEXT NOT NULL,
    target_type TEXT,
    target_id TEXT,
    result TEXT NOT NULL,
    details TEXT
);

CREATE INDEX IF NOT EXISTS idx_audit_time ON projection_audit(occurred_at DESC);