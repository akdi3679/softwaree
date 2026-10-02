use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Arc;
use tokio::sync::{Mutex, RwLock};
use sqlx::SqlitePool;
use chrono::{DateTime, Utc};

use crate::error::{AppError, AppResult};
use crate::observability::metrics::Metrics;
use crate::paths::AppPaths;
use crate::sync::reconnect_throttle::ReconnectThrottle;

pub struct AppState {
    pub paths: AppPaths,
    pub device_id: String,
    pub projects: Arc<RwLock<HashMap<String, ProjectHandle>>>,
    pub sync: Arc<RwLock<SyncState>>,
    pub reconnect_throttle: Arc<ReconnectThrottle>,
    pub http_client: reqwest::Client,
    pub cloud_base_url: String,
    pub cloud_token: Arc<Mutex<String>>,
    pub metrics: Arc<Metrics>,
    pub system_db: Arc<RwLock<Option<SqlitePool>>>,
}

#[derive(Clone)]
pub struct ProjectHandle {
    pub project_id: String,
    pub db_path: PathBuf,
    pub db: SqlitePool,
    pub last_sequence: i64,
}

#[derive(Default)]
pub struct SyncState {
    pub connected_users: Vec<String>,
    pub last_user_heartbeat: HashMap<String, DateTime<Utc>>,
}

impl AppState {
    pub fn new(paths: AppPaths) -> AppResult<Self> {
        let cloud_base_url = std::env::var("CLOUD_BASE_URL")
            .unwrap_or_else(|_| "http://localhost:8787".to_string());
        let http_client = reqwest::Client::builder()
            .timeout(std::time::Duration::from_secs(60))
            .build()
            .unwrap_or_else(|_| reqwest::Client::new());
        Ok(Self {
            paths,
            device_id: "unknown".to_string(),
            projects: Arc::new(RwLock::new(HashMap::new())),
            sync: Arc::new(RwLock::new(SyncState::default())),
            reconnect_throttle: Arc::new(ReconnectThrottle::new(64)),
            http_client,
            cloud_base_url,
            cloud_token: Arc::new(Mutex::new(String::new())),
            metrics: Arc::new(Metrics::new()),
            system_db: Arc::new(RwLock::new(None)),
        })
    }

    pub fn device_id(&self) -> String {
        self.device_id.clone()
    }

    pub async fn load_device_key(&self) -> AppResult<[u8; 32]> {
        let path = self.paths.keys_dir.join("device.key");
        let bytes = tokio::fs::read(&path).await?;
        let arr: [u8; 32] = bytes
            .as_slice()
            .try_into()
            .map_err(|_| AppError::Crypto("device key must be 32 bytes".into()))?;
        Ok(arr)
    }

    pub async fn plan_for_project(&self, project_id: &str) -> AppResult<String> {
        let handle = {
            let projects = self.projects.read().await;
            projects.get(project_id).cloned()
        };
        let handle = handle
            .ok_or_else(|| AppError::NotFound(format!("project {project_id}")))?;
        let plan: Option<String> =
            sqlx::query_scalar("SELECT plan_id FROM projects WHERE id = ?")
                .bind(project_id)
                .fetch_optional(&handle.db)
                .await
                .ok()
                .flatten();
        Ok(plan.unwrap_or_else(|| "starter".to_string()))
    }

    pub async fn plan_for_current_project(&self) -> AppResult<String> {
        let first_id = {
            let projects = self.projects.read().await;
            projects.keys().next().cloned()
        };
        match first_id {
            Some(id) => self.plan_for_project(&id).await,
            None => Ok("local".to_string()),
        }
    }
}