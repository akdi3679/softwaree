-- Module projection tables (v1: medical-reception + food-lab).
-- One row per entity. `data` holds the entity's JSON payload.
-- The sync applier writes rows as events arrive; data.rs:query_domain reads them.

CREATE TABLE IF NOT EXISTS projection_patients (
    id TEXT PRIMARY KEY,
    data TEXT NOT NULL,
    last_event_sequence INTEGER NOT NULL,
    updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_projection_patients_seq ON projection_patients(last_event_sequence);

CREATE TABLE IF NOT EXISTS projection_appointments (
    id TEXT PRIMARY KEY,
    data TEXT NOT NULL,
    last_event_sequence INTEGER NOT NULL,
    updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_projection_appointments_seq ON projection_appointments(last_event_sequence);

CREATE TABLE IF NOT EXISTS projection_visits (
    id TEXT PRIMARY KEY,
    data TEXT NOT NULL,
    last_event_sequence INTEGER NOT NULL,
    updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_projection_visits_seq ON projection_visits(last_event_sequence);

CREATE TABLE IF NOT EXISTS projection_samples (
    id TEXT PRIMARY KEY,
    data TEXT NOT NULL,
    last_event_sequence INTEGER NOT NULL,
    updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_projection_samples_seq ON projection_samples(last_event_sequence);