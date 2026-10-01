# TASK ID: ADMIN-004.3
# TITLE: Add project database manager (open/close/create)
# STATUS: pending
# DEPENDENCIES: ADMIN-004.2
# ALLOWED FILES: product/apps/admin/src-tauri/src/db/project_db.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
Create the project database manager — open, close, create new project DBs.

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/src-tauri/src/db/project_db.rs`:

```rust
use std::path::{Path, PathBuf};
use sqlx::SqlitePool;
use tokio::sync::RwLock;
use std::collections::HashMap;
use std::sync::Arc;
use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};

use crate::crypto::kdf::{self, info};
use crate::db::migrations;
use crate::db::pool;
use crate::error::{AppError, AppResult};
use crate::state::AppState;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectMetadata {
    pub project_id: String,
    pub name: String,
    pub admin_last_name: String,  // human responsible for this project
    pub business_type: String,
    pub business_name: String,    // the company / clinic / lab
    pub state: String, // creating / active / suspended / archived
    pub created_at: DateTime<Utc>,
    pub activated_at: Option<DateTime<Utc>>,
    pub last_opened_at: Option<DateTime<Utc>>,
}

pub struct ProjectDatabase {
    pub pool: SqlitePool,
    pub metadata: ProjectMetadata,
}

/// Open a project database. Creates the file + runs migrations if first time.
pub async fn open_project(
    state: &AppState,
    project_id: &str,
) -> AppResult<ProjectDatabase> {
    let project_dir = state.paths.projects_dir.join(project_id);
    std::fs::create_dir_all(&project_dir)?;
    let db_path = project_dir.join("project.db");
    let meta_path = project_dir.join("metadata.json");

    // Derive encryption key from device key
    let device_sk = state.device_key.sign_bytes();
    let db_key = kdf::derive_32(&device_sk, project_id.as_bytes(), info::PROJECT_DB_ENCRYPTION)?;

    // Open pool (encryption key in v1.1; for now use plain)
    let pool = pool::create_pool(&db_path, None).await?;

    // Run migrations
    migrations::run(&pool).await?;

    // Load or create metadata
    let metadata = if meta_path.exists() {
        let s = std::fs::read_to_string(&meta_path)?;
        serde_json::from_str(&s)?
    } else {
        let m = ProjectMetadata {
            project_id: project_id.to_string(),
            name: project_id.to_string(), // default; updated on creation
            admin_last_name: String::new(),  // filled on creation
            business_type: "other".to_string(),
            business_name: String::new(),    // filled on creation
            state: "creating".to_string(),
            created_at: Utc::now(),
            activated_at: None,
            last_opened_at: Some(Utc::now()),
        };
        std::fs::write(&meta_path, serde_json::to_string_pretty(&m)?)?;
        m
    };

    Ok(ProjectDatabase { pool, metadata })
}

/// Create a new project. Generates ID, creates directory + DB + metadata.
pub async fn create_project(
    state: &AppState,
    name: &str,
    admin_last_name: &str,
    business_type: &str,
    business_name: &str,
) -> AppResult<ProjectDatabase> {
    // Generate project_id
    let project_id = format!("proj_{}", uuid_v7_like());

    let mut db = open_project(state, &project_id).await?;
    db.metadata.name = name.to_string();
    db.metadata.admin_last_name = admin_last_name.to_string();
    db.metadata.business_type = business_type.to_string();
    db.metadata.business_name = business_name.to_string();
    db.metadata.created_at = Utc::now();
    db.metadata.state = "creating".to_string();
    db.metadata.last_opened_at = Some(Utc::now());

    save_metadata(state, &db.metadata)?;

    Ok(db)
}

pub fn save_metadata(state: &AppState, metadata: &ProjectMetadata) -> AppResult<()> {
    let meta_path = state.paths.projects_dir.join(&metadata.project_id).join("metadata.json");
    std::fs::write(meta_path, serde_json::to_string_pretty(metadata)?)?;
    Ok(())
}

fn uuid_v7_like() -> String {
    use rand::Rng;
    let mut rng = rand::thread_rng();
    let bytes: [u8; 14] = std::array::from_fn(|_| rng.gen());
    // base32 crockford (simplified — real impl in v1.1)
    base32_crockford(&bytes)
}

fn base32_crockford(bytes: &[u8]) -> String {
    const ALPHABET: &[u8; 32] = b"0123456789abcdefghjkmnpqrstvwxyz";
    let mut out = String::with_capacity((bytes.len() * 8 + 4) / 5);
    let mut buffer: u64 = 0;
    let mut bits_in_buffer = 0;
    for &b in bytes {
        buffer = (buffer << 8) | (b as u64);
        bits_in_buffer += 8;
        while bits_in_buffer >= 5 {
            bits_in_buffer -= 5;
            let idx = ((buffer >> bits_in_buffer) & 0x1F) as usize;
            out.push(ALPHABET[idx] as char);
        }
    }
    if bits_in_buffer > 0 {
        let idx = ((buffer << (5 - bits_in_buffer)) & 0x1F) as usize;
        out.push(ALPHABET[idx] as char);
    }
    out
}
```

## TESTS

```bash
cd product
test -f apps/admin/src-tauri/src/db/project_db.rs || { echo "FAIL"; exit 1; }
grep -q "open_project" apps/admin/src-tauri/src/db/project_db.rs || { echo "FAIL"; exit 1; }
cd apps/admin/src-tauri && cargo check --quiet 2>&1 | tail -5 || { echo "FAIL"; exit 1; }
echo "OK"
```
