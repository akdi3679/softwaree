use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use sqlx::SqlitePool;
use serde_json::Value;

use crate::error::AppResult;
use crate::events::store;

#[derive(Clone)]
pub struct DeliveryTarget {
    pub user_id: String,
    pub device_id: String,
    pub sink: Arc<dyn EventSink>,
}

#[async_trait::async_trait]
pub trait EventSink: Send + Sync {
    async fn send(&self, event_json: Value) -> Result<(), String>;
}

#[derive(Default)]
pub struct DispatcherState {
    pub targets: HashMap<String, DeliveryTarget>,
}

pub fn register_target(state: &Arc<RwLock<DispatcherState>>, target: DeliveryTarget) {
    let key = format!("{}:{}", target.user_id, target.device_id);
    let mut s = state.blocking_write();
    s.targets.insert(key, target);
}

pub fn unregister_target(state: &Arc<RwLock<DispatcherState>>, user_id: &str, device_id: &str) {
    let key = format!("{}:{}", user_id, device_id);
    let mut s = state.blocking_write();
    s.targets.remove(&key);
}

pub async fn dispatch_pending(
    pool: &SqlitePool,
    state: &Arc<RwLock<DispatcherState>>,
) -> AppResult<u64> {
    let pending = store::read_since(pool, 0, 1000).await?;
    let mut count = 0u64;

    let targets: Vec<DeliveryTarget> = {
        let s = state.read().await;
        s.targets.values().cloned().collect()
    };

    for event in &pending {
        let event_json = serde_json::to_value(event)?;
        for target in &targets {
            if let Err(e) = target.sink.send(event_json.clone()).await {
                tracing::warn!(error = %e, user_id = %target.user_id, "delivery failed");
            } else {
                count += 1;
            }
        }
    }
    Ok(count)
}
