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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn check_returns_none_for_unknown() {
        assert!(check("test.cmd", "no-such-key-xyz").is_none());
    }

    #[test]
    fn record_then_check_returns_value() {
        record("test.cmd", "k1", "agg-1");
        assert_eq!(check("test.cmd", "k1").as_deref(), Some("agg-1"));
    }
}
