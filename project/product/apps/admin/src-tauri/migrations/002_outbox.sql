CREATE TABLE events (
    sequence INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id TEXT NOT NULL UNIQUE,
    event_type TEXT NOT NULL,
    aggregate_type TEXT NOT NULL,
    aggregate_id TEXT NOT NULL,
    aggregate_version INTEGER NOT NULL,
    actor_user_id TEXT NOT NULL,
    device_id TEXT NOT NULL,
    occurred_at TEXT NOT NULL,
    correlation_id TEXT,
    causation_id TEXT,
    payload TEXT NOT NULL,
    delivery_state TEXT NOT NULL DEFAULT 'pending'
);

CREATE INDEX idx_events_aggregate ON events(aggregate_type, aggregate_id);
CREATE INDEX idx_events_occurred ON events(occurred_at);

CREATE TABLE user_projections (
    user_id TEXT NOT NULL,
    device_id TEXT NOT NULL,
    last_applied_sequence INTEGER NOT NULL DEFAULT 0,
    snapshot_at_sequence INTEGER,
    snapshot_at TEXT,
    projection_format_version INTEGER NOT NULL DEFAULT 1,
    updated_at TEXT NOT NULL,
    PRIMARY KEY (user_id, device_id)
);

CREATE TABLE event_deliveries (
    event_sequence INTEGER NOT NULL REFERENCES events(sequence) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    device_id TEXT NOT NULL,
    state TEXT NOT NULL DEFAULT 'pending',
    attempted_at TEXT,
    delivered_at TEXT,
    denied_reason TEXT,
    failure_reason TEXT,
    attempt_count INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (event_sequence, user_id, device_id)
);

CREATE TABLE tombstones (
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    deleted_at TEXT NOT NULL,
    deleted_by_sequence INTEGER NOT NULL,
    deleted_by_user_id TEXT NOT NULL,
    reason TEXT,
    PRIMARY KEY (entity_type, entity_id)
);
