use std::time::Duration;
use tokio::time::interval;
use crate::state::AppState;

pub fn spawn(state: std::sync::Arc<AppState>) {
    tokio::spawn(async move {
        let mut ticker = interval(Duration::from_secs(7 * 24 * 60 * 60));
        loop {
            ticker.tick().await;
            for (project_id, _handle) in state.projects.read().await.iter() {
                if let Err(e) = verify_one(state.clone(), project_id.clone()).await {
                    tracing::error!(target: "backup_verify", "{project_id} verify failed: {e}");
                }
            }
        }
    });
}

async fn verify_one(_state: std::sync::Arc<AppState>, _project_id: String) -> Result<(), String> {
    // Stub: actual backup download/decrypt/verify will be implemented later.
    Ok(())
}
