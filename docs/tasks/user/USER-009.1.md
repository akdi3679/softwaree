# TASK ID: USER-009.1
# TITLE: Add User image attachments (for visits)
# STATUS: pending
# DEPENDENCIES: SYNC-003.3
# ALLOWED FILES: product/apps/user/src-tauri/src/commands/attachments.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
User can attach images (photos, X-rays) to a visit or sample.

## REQUIRED IMPLEMENTATION

Create `product/apps/user/src-tauri/src/commands/attachments.rs`:

```rust
use base64::Engine;
use base64::engine::general_purpose::STANDARD as B64;
use sha2::{Digest, Sha256};
use std::path::Path;
use tauri::State;
use tokio::fs;
use crate::error::AppResult;
use crate::state::AppState;

const MAX_ATTACHMENT_SIZE: usize = 10 * 1024 * 1024; // 10 MB
const ATTACHMENTS_DIR: &str = "attachments";

#[tauri::command]
pub async fn save_attachment(
    state: State<'_, AppState>,
    aggregate_type: String,
    aggregate_id: String,
    filename: String,
    data: Vec<u8>,
) -> AppResult<String> {
    if data.len() > MAX_ATTACHMENT_SIZE {
        return Err(crate::error::AppError::Validation(format!("attachment too large: {}", data.len())));
    }
    // Hash for content addressing
    let mut hasher = Sha256::new();
    hasher.update(&data);
    let sha256 = hex::encode(hasher.finalize());
    // Save to disk
    let dir = state.paths.projections_dir.join(ATTACHMENTS_DIR).join(&aggregate_type).join(&aggregate_id);
    fs::create_dir_all(&dir).await?;
    let path = dir.join(format!("{}-{}", sha256, filename));
    fs::write(&path, &data).await?;
    Ok(serde_json::json!({
        "sha256": sha256,
        "filename": filename,
        "size_bytes": data.len(),
        "stored_path": path.to_string_lossy(),
    }).to_string())
}

#[tauri::command]
pub async fn get_attachment(state: State<'_, AppState>, sha256: String) -> AppResult<Vec<u8>> {
    // Search all attachments dirs for this hash
    let root = state.paths.projections_dir.join(ATTACHMENTS_DIR);
    if !root.exists() { return Err(crate::error::AppError::NotFound("no attachments".into())); }
    // Simple linear search; in production, use an index
    let mut stack = vec![root];
    while let Some(dir) = stack.pop() {
        let mut entries = fs::read_dir(&dir).await?;
        while let Some(entry) = entries.next_entry().await? {
            let path = entry.path();
            if path.is_dir() {
                stack.push(path);
            } else if let Some(name) = path.file_name().and_then(|n| n.to_str()) {
                if name.starts_with(&sha256) {
                    return fs::read(&path).await;
                }
            }
        }
    }
    Err(crate::error::AppError::NotFound(format!("attachment not found: {sha256}")))
}
```

## TESTS

```bash
cd product
test -f apps/user/src-tauri/src/commands/attachments.rs || { echo "FAIL"; exit 1; }
grep -q "save_attachment" apps/user/src-tauri/src/commands/attachments.rs || { echo "FAIL"; exit 1; }
echo "OK"
```
