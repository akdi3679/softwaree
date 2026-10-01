# TASK ID: SYNC-001.2
# TITLE: Add sync frame validation
# STATUS: pending
# DEPENDENCIES: SYNC-001.1
# ALLOWED FILES: product/apps/admin/src-tauri/src/sync/validation.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Server-side validation of incoming sync frames. Reject malformed/oversize frames.

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/src-tauri/src/sync/validation.rs`:

```rust
use crate::error::{AppError, AppResult};

pub const MAX_FRAME_BYTES: usize = 1 * 1024 * 1024; // 1 MB

pub struct FrameValidator;

impl FrameValidator {
    /// Validate a raw frame before parsing JSON.
    pub fn validate_raw(bytes: &[u8]) -> AppResult<()> {
        if bytes.is_empty() {
            return Err(AppError::Protocol("empty frame".into()));
        }
        if bytes.len() > MAX_FRAME_BYTES {
            return Err(AppError::Protocol(format!("frame too large: {}", bytes.len())));
        }
        // Must be valid UTF-8
        std::str::from_utf8(bytes).map_err(|e| AppError::Protocol(format!("invalid utf-8: {e}")))?;
        Ok(())
    }

    /// Validate the JSON structure (basic).
    pub fn validate_message(parsed: &serde_json::Value) -> AppResult<()> {
        let obj = parsed.as_object().ok_or_else(|| AppError::Protocol("not an object".into()))?;
        let ty = obj.get("type").and_then(|v| v.as_str()).ok_or_else(|| AppError::Protocol("missing type".into()))?;
        match ty {
            "hello" => validate_hello(obj),
            "sync_request" => validate_sync_request(obj),
            "ack" => validate_ack(obj),
            "heartbeat" => Ok(()),
            other => Err(AppError::Protocol(format!("unknown message type: {other}"))),
        }
    }
}

fn validate_hello(o: &serde_json::Map<String, serde_json::Value>) -> AppResult<()> {
    req_field(o, "protocol_version")?;
    req_field(o, "user_id")?;
    req_field(o, "device_id")?;
    req_field(o, "project_id")?;
    req_field(o, "device_pubkey")?;
    req_field(o, "device_signature")?;
    let ver = o["protocol_version"].as_u64().ok_or_else(|| AppError::Protocol("version not number".into()))?;
    if ver != 1 {
        return Err(AppError::Protocol(format!("unsupported protocol version: {ver}")));
    }
    let user_id = o["user_id"].as_str().ok_or_else(|| AppError::Protocol("user_id not string".into()))?;
    if !user_id.starts_with("usr_") {
        return Err(AppError::Protocol("user_id must start with usr_".into()));
    }
    Ok(())
}

fn validate_sync_request(o: &serde_json::Map<String, serde_json::Value>) -> AppResult<()> {
    let last = o.get("last_sequence").and_then(|v| v.as_i64()).ok_or_else(|| AppError::Protocol("missing last_sequence".into()))?;
    if last < 0 {
        return Err(AppError::Protocol("last_sequence must be non-negative".into()));
    }
    Ok(())
}

fn validate_ack(o: &serde_json::Map<String, serde_json::Value>) -> AppResult<()> {
    let seq = o.get("acked_through_sequence").and_then(|v| v.as_i64()).ok_or_else(|| AppError::Protocol("missing acked_through_sequence".into()))?;
    if seq < 0 {
        return Err(AppError::Protocol("acked_through_sequence must be non-negative".into()));
    }
    Ok(())
}

fn req_field(o: &serde_json::Map<String, serde_json::Value>, name: &str) -> AppResult<()> {
    if !o.contains_key(name) {
        return Err(AppError::Protocol(format!("missing field: {name}")));
    }
    Ok(())
}
```

## TESTS

```bash
cd product
test -f apps/admin/src-tauri/src/sync/validation.rs || { echo "FAIL"; exit 1; }
grep -q "MAX_FRAME_BYTES" apps/admin/src-tauri/src/sync/validation.rs || { echo "FAIL"; exit 1; }
echo "OK"
```
