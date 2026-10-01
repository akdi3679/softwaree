# TASK ID: USER-001.5
# TITLE: Add User SQLite projection DB skeleton
# STATUS: pending
# DEPENDENCIES: USER-001.4
# ALLOWED FILES: product/apps/user/src-tauri/src/db/projection_db.rs, product/apps/user/src-tauri/src/db/mod.rs, product/apps/user/src-tauri/migrations/001_projection.sql
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Add the User's local projection SQLite DB. Stores: events, snapshot, applied state.

## REQUIRED IMPLEMENTATION

Create `product/apps/user/src-tauri/src/db/mod.rs`:

```rust
pub mod projection_db;
```

Create `product/apps/user/src-tauri/migrations/001_projection.sql`:

```sql
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
    device_id TEXT NOT NULL,
    occurred_at TEXT NOT NULL,
    correlation_id TEXT,
    causation_id TEXT,
    payload TEXT NOT NULL,
    applied_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_events_aggregate ON projection_events(aggregate_type, aggregate_id);
CREATE INDEX IF NOT EXISTS idx_events_type ON projection_events(event_type);

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
```

Create `product/apps/user/src-tauri/src/db/projection_db.rs`:

```rust
use sqlx::sqlite::SqliteConnectOptions;
use sqlx::SqlitePool;
use std::path::Path;
use std::str::FromStr;

use crate::error::AppResult;

pub struct ProjectionDb {
    pub pool: SqlitePool,
    pub project_id: String,
}

impl ProjectionDb {
    pub async fn open(db_path: &Path, project_id: &str) -> AppResult<Self> {
        let url = format!("sqlite://{}?mode=rwc", db_path.display());
        let opts = SqliteConnectOptions::from_str(&url)?
            .create_if_missing(true)
            .journal_mode(sqlx::sqlite::SqliteJournalMode::Wal)
            .foreign_keys(true);
        let pool = SqlitePool::connect_with(opts).await?;
        sqlx::migrate!("./migrations").run(&pool).await?;
        Ok(Self {
            pool,
            project_id: project_id.to_string(),
        })
    }

    pub async fn get_position(&self) -> AppResult<i64> {
        let row: Option<(i64,)> = sqlx::query_as(
            "SELECT last_applied_sequence FROM projection_state WHERE project_id = ?",
        )
        .bind(&self.project_id)
        .fetch_optional(&self.pool)
        .await?;
        Ok(row.map(|(s,)| s).unwrap_or(0))
    }
}
```

## TESTS

```bash
cd product
test -f apps/user/src-tauri/src/db/projection_db.rs || { echo "FAIL"; exit 1; }
test -f apps/user/src-tauri/migrations/001_projection.sql || { echo "FAIL: no migration"; exit 1; }
grep -q "projection_state" apps/user/src-tauri/migrations/001_projection.sql || { echo "FAIL"; exit 1; }
echo "OK"
```
