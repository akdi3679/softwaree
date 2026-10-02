use once_cell::sync::Lazy;
use std::collections::HashMap;
use std::sync::RwLock;

static CACHE: Lazy<RwLock<HashMap<String, String>>> =
    Lazy::new(|| RwLock::new(HashMap::new()));

pub fn make_key(command_type: &str, idempotency_key: &str) -> String {
    format!("{command_type}::{idempotency_key}")
}

pub fn check(command_type: &str, idempotency_key: &str) -> Option<String> {
    let key = make_key(command_type, idempotency_key);
    CACHE.read().ok()?.get(&key).cloned()
}

pub fn record(command_type: &str, idempotency_key: &str, aggregate_id: &str) {
    if let Ok(mut cache) = CACHE.write() {
        cache.insert(make_key(command_type, idempotency_key), aggregate_id.to_string());
    }
}
