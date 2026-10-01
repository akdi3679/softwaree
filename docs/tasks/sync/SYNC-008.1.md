# TASK ID: SYNC-008.1
# TITLE: Add sync: compression (zstd) for large events
# STATUS: pending
# DEPENDENCIES: USER-018.2
# ALLOWED FILES: product/apps/admin/src-tauri/src/sync/compress.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Compress large event batches. Use zstd for speed + ratio.

## REQUIRED IMPLEMENTATION

Add to `Cargo.toml`:
```toml
zstd = "0.13"
```

Create `product/apps/admin/src-tauri/src/sync/compress.rs`:

```rust
use crate::error::AppResult;

const MIN_SIZE: usize = 1024; // Don't compress small frames
const COMPRESSION_LEVEL: i32 = 3;

pub fn compress(data: &[u8]) -> AppResult<Vec<u8>> {
    if data.len() < MIN_SIZE {
        return Ok(data.to_vec());
    }
    zstd::encode_all(data, COMPRESSION_LEVEL).map_err(|e| crate::error::AppError::Protocol(format!("zstd encode: {e}")))
}

pub fn decompress(data: &[u8]) -> AppResult<Vec<u8>> {
    if data.len() < MIN_SIZE {
        return Ok(data.to_vec());
    }
    zstd::decode_all(data).map_err(|e| crate::error::AppError::Protocol(format!("zstd decode: {e}")))
}
```

## TESTS

```bash
cd product
test -f apps/admin/src-tauri/src/sync/compress.rs || { echo "FAIL"; exit 1; }
grep -q "zstd" apps/admin/src-tauri/src/sync/compress.rs || { echo "FAIL"; exit 1; }
echo "OK"
```
