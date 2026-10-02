use std::sync::Arc;
use std::time::Duration;
use tokio::sync::RwLock;
use tokio::time::sleep;

use crate::error::AppResult;
use crate::state::AppState;
use crate::sync::client::{AdminEndpoint, SyncClient};

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct SavedEndpoint {
    pub host: String,
    pub port: u16,
    pub user_id: String,
    pub project_id: String,
    pub auth_token: String,
}

const RECONNECT_BACKOFF_SECS: [u64; 6] = [1, 2, 5, 10, 30, 60];

pub fn spawn(state: Arc<AppState>, saved: Option<SavedEndpoint>) {
    tokio::spawn(async move {
        let mut attempt = 0u32;
        loop {
            let saved = match saved.clone() {
                Some(s) => s,
                None => {
                    sleep(Duration::from_secs(60)).await;
                    continue;
                }
            };
            let endpoint = AdminEndpoint {
                host: saved.host.clone(),
                port: saved.port,
            };
            match SyncClient::connect(
                &endpoint,
                &saved.user_id,
                &state.device.key,
                &saved.project_id,
                &saved.auth_token,
            ).await {
                Ok((client, _session)) => {
                    tracing::info!(host = %endpoint.host, "reconnected");
                    *state.sync.write().await = Some(client);
                    attempt = 0;
                    sleep(Duration::from_secs(60)).await;
                }
                Err(e) => {
                    let idx = (attempt as usize).min(RECONNECT_BACKOFF_SECS.len() - 1);
                    let delay = RECONNECT_BACKOFF_SECS[idx];
                    tracing::warn!(error = %e, attempt, retry_in = delay, "reconnect failed");
                    sleep(Duration::from_secs(delay)).await;
                    attempt += 1;
                }
            }
        }
    });
}
