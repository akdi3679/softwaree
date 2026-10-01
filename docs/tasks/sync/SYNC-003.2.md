# TASK ID: SYNC-003.2
# TITLE: Add sync binary frame encoding (CBOR for large events)
# STATUS: pending
# DEPENDENCIES: SYNC-003.1
# ALLOWED FILES: product/apps/admin/src-tauri/src/sync/cbor_frame.rs, product/apps/user/src-tauri/src/sync/cbor_frame.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Use CBOR instead of JSON for large event batches. Smaller, faster.

## REQUIRED IMPLEMENTATION

Add to both Admin and User `Cargo.toml`:
```toml
ciborium = "0.2"
```

Create `product/apps/admin/src-tauri/src/sync/cbor_frame.rs`:

```rust
use ciborium::{Value, de, ser};
use crate::error::{AppError, AppResult};

/// Encode a frame as CBOR. Smaller than JSON for large payloads.
pub fn encode<T: serde::Serialize>(value: &T) -> AppResult<Vec<u8>> {
    let mut buf = Vec::new();
    ser::into_writer(value, &mut buf).map_err(|e| AppError::Protocol(format!("cbor encode: {e}")))?;
    Ok(buf)
}

pub fn decode<T: serde::de::DeserializeOwned>(bytes: &[u8]) -> AppResult<T> {
    let value: Value = de::from_reader(bytes).map_err(|e| AppError::Protocol(format!("cbor decode: {e}")))?;
    let result: T = serde_json::from_value(serde_json::to_value(value).map_err(|e| AppError::Protocol(e.to_string()))?)
        .map_err(|e| AppError::Protocol(e.to_string()))?;
    Ok(result)
}
```

Mirror on the User side (same file).

## TESTS

```bash
cd product
test -f apps/admin/src-tauri/src/sync/cbor_frame.rs || { echo "FAIL"; exit 1; }
test -f apps/user/src-tauri/src/sync/cbor_frame.rs || { echo "FAIL: no user"; exit 1; }
grep -q "ciborium" apps/admin/src-tauri/Cargo.toml || { echo "FAIL: no ciborium"; exit 1; }
echo "OK"
```
