# TASK ID: ADMIN-004.1
# TITLE: Add project SQLite migrations module
# STATUS: pending
# DEPENDENCIES: ADMIN-003.7
# ALLOWED FILES: product/apps/admin/src-tauri/src/db/migrations.rs, product/apps/admin/src-tauri/src/db/mod.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Create the project migrations module — defines the schema for a project database.

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/src-tauri/src/db/mod.rs`:

```rust
pub mod migrations;
pub mod pool;
pub mod project_db;
```

Create `product/apps/admin/src-tauri/src/db/migrations.rs`:

```rust
use sqlx::SqlitePool;
use crate::error::AppResult;

/// Apply migrations in order. Idempotent.
pub async fn run(pool: &SqlitePool) -> AppResult<()> {
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS schema_version (
            version INTEGER PRIMARY KEY,
            applied_at TEXT NOT NULL
        );
        "#,
    )
    .execute(pool)
    .await?;

    // v1: core tables
    if !is_applied(pool, 1).await? {
        sqlx::query(include_str!("../../migrations/001_core.sql"))
            .execute(pool)
            .await?;
        mark_applied(pool, 1).await?;
    }

    // v2: outbox
    if !is_applied(pool, 2).await? {
        sqlx::query(include_str!("../../migrations/002_outbox.sql"))
            .execute(pool)
            .await?;
        mark_applied(pool, 2).await?;
    }

    Ok(())
}

async fn is_applied(pool: &SqlitePool, version: i64) -> AppResult<bool> {
    let row: Option<(i64,)> = sqlx::query_as("SELECT version FROM schema_version WHERE version = ?")
        .bind(version)
        .fetch_optional(pool)
        .await?;
    Ok(row.is_some())
}

async fn mark_applied(pool: &SqlitePool, version: i64) -> AppResult<()> {
    sqlx::query("INSERT INTO schema_version (version, applied_at) VALUES (?, ?)")
        .bind(version)
        .bind(chrono::Utc::now().to_rfc3339())
        .execute(pool)
        .await?;
    Ok(())
}
```

Create `product/apps/admin/src-tauri/migrations/001_core.sql`:

```sql
-- Core business tables (per project)
-- Module-specific tables added in later migrations

CREATE TABLE projects (
    id TEXT PRIMARY KEY,                          -- proj_xxx
    name TEXT NOT NULL,
    admin_last_name TEXT NOT NULL,         -- human responsible for the project
    business_type TEXT NOT NULL,
    business_name TEXT NOT NULL,           -- company / clinic / lab name
    state TEXT NOT NULL DEFAULT 'active',
    created_at TEXT NOT NULL,
    activated_at TEXT,
    archived_at TEXT
);

CREATE TABLE users (
    id TEXT PRIMARY KEY,                          -- usr_xxx
    email TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    state TEXT NOT NULL DEFAULT 'active',
    created_at TEXT NOT NULL
);

CREATE TABLE roles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    display_name TEXT NOT NULL,
    is_built_in INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    UNIQUE(name)
);

CREATE TABLE role_permissions (
    role_id TEXT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission TEXT NOT NULL,
    scope TEXT,
    granted_at TEXT NOT NULL,
    PRIMARY KEY (role_id, permission)
);

CREATE TABLE user_roles (
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id TEXT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    granted_at TEXT NOT NULL,
    granted_by TEXT,
    PRIMARY KEY (user_id, role_id)
);

CREATE TABLE audit_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    occurred_at TEXT NOT NULL,
    actor_user_id TEXT,
    actor_device_id TEXT,
    action TEXT NOT NULL,
    target_type TEXT,
    target_id TEXT,
    result TEXT NOT NULL,
    details TEXT,
    prev_hash TEXT NOT NULL,
    entry_hash TEXT NOT NULL
);

CREATE INDEX idx_audit_occurred ON audit_entries(occurred_at);
CREATE INDEX idx_audit_actor ON audit_entries(actor_user_id);
CREATE INDEX idx_audit_target ON audit_entries(target_type, target_id);
```

Create `product/apps/admin/src-tauri/migrations/002_outbox.sql`:

```sql
-- Outbox for events
CREATE TABLE events (
    sequence INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id TEXT NOT NULL UNIQUE,        -- evt_xxx
    event_type TEXT NOT NULL,
    aggregate_type TEXT NOT NULL,
    aggregate_id TEXT NOT NULL,
    aggregate_version INTEGER NOT NULL,
    actor_user_id TEXT NOT NULL,
    device_id TEXT NOT NULL,
    occurred_at TEXT NOT NULL,
    correlation_id TEXT,
    causation_id TEXT,
    payload TEXT NOT NULL,                -- JSON
    -- Per-user delivery tracking (denormalized for query speed)
    delivery_state TEXT NOT NULL DEFAULT 'pending'  -- pending / delivering / delivered
);

CREATE INDEX idx_events_aggregate ON events(aggregate_type, aggregate_id);
CREATE INDEX idx_events_occurred ON events(occurred_at);

-- User projection tracking
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

-- Per-event delivery to each user
CREATE TABLE event_deliveries (
    event_sequence INTEGER NOT NULL REFERENCES events(sequence) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    device_id TEXT NOT NULL,
    state TEXT NOT NULL DEFAULT 'pending',  -- pending/delivered/denied/failed
    attempted_at TEXT,
    delivered_at TEXT,
    denied_reason TEXT,
    failure_reason TEXT,
    attempt_count INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (event_sequence, user_id, device_id)
);

-- Tombstones for soft-deleted entities
CREATE TABLE tombstones (
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    deleted_at TEXT NOT NULL,
    deleted_by_sequence INTEGER NOT NULL,
    deleted_by_user_id TEXT NOT NULL,
    reason TEXT,
    PRIMARY KEY (entity_type, entity_id)
);
```

## TESTS

```bash
cd product
test -f apps/admin/src-tauri/src/db/migrations.rs || { echo "FAIL"; exit 1; }
test -f apps/admin/src-tauri/migrations/001_core.sql || { echo "FAIL: 001"; exit 1; }
test -f apps/admin/src-tauri/migrations/002_outbox.sql || { echo "FAIL: 002"; exit 1; }
cd apps/admin/src-tauri && cargo check --quiet 2>&1 | tail -5 || { echo "FAIL: cargo"; exit 1; }
echo "OK"
```
