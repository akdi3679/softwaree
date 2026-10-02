use sqlx::SqlitePool;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

use crate::db::{migrations, pool};
use crate::error::AppResult;
use crate::state::AppState;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectMetadata {
    pub project_id: String,
    pub name: String,
    pub admin_last_name: String,
    pub business_type: String,
    pub business_name: String,
    pub state: String,
    pub created_at: DateTime<Utc>,
    pub activated_at: Option<DateTime<Utc>>,
    pub last_opened_at: Option<DateTime<Utc>>,
}

pub struct ProjectDatabase {
    pub pool: SqlitePool,
    pub metadata: ProjectMetadata,
}

pub async fn open_project(
    state: &AppState,
    project_id: &str,
) -> AppResult<ProjectDatabase> {
    let project_dir = state.paths.projects_dir.join(project_id);
    std::fs::create_dir_all(&project_dir)?;
    let db_path = project_dir.join("project.db");
    let meta_path = project_dir.join("metadata.json");

    let pool = pool::create_pool(&db_path).await?;
    migrations::run(&pool).await?;

    let metadata = if meta_path.exists() {
        let s = std::fs::read_to_string(&meta_path)?;
        serde_json::from_str(&s)?
    } else {
        let m = ProjectMetadata {
            project_id: project_id.to_string(),
            name: project_id.to_string(),
            admin_last_name: String::new(),
            business_type: "other".to_string(),
            business_name: String::new(),
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

pub async fn create_project(
    state: &AppState,
    name: &str,
    admin_last_name: &str,
    business_type: &str,
    business_name: &str,
) -> AppResult<ProjectDatabase> {
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
