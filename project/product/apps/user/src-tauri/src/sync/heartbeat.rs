use std::sync::Arc;
use std::time::Duration;
use tokio::time::sleep;

use crate::state::AppState;

const HEARTBEAT_INTERVAL_SECS: u64 = 30;
const MAX_MISSED: u32 = 3;

pub fn spawn(state: Arc<AppState>) {
    tokio::spawn(async move {
        let mut missed: u32 = 0;
        loop {
            sleep(Duration::from_secs(HEARTBEAT_INTERVAL_SECS)).await;

            let guard = state.sync.read().await;
            match guard.as_ref() {
                Some(client) => {
                    match client.heartbeat().await {
                        Ok(_) => {
                            missed = 0;
                        }
                        Err(e) => {
                            missed += 1;
                            tracing::warn!(error = %e, missed, "heartbeat failed");
                        }
                    }
                }
                None => {
                    drop(guard);
                    sleep(Duration::from_secs(HEARTBEAT_INTERVAL_SECS)).await;
                    continue;
                }
            }
            drop(guard);

            if missed >= MAX_MISSED {
                tracing::warn!(missed, "too many missed heartbeats, will reconnect");
                *state.sync.write().await = None;
                missed = 0;
            }
        }
    });
}
