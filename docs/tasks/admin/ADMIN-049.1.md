# TASK ID: ADMIN-049.1
# TITLE: Add Admin: app update notification banner
# STATUS: pending
# DEPENDENCIES: ADMIN-048.2
# ALLOWED FILES: product/apps/admin/src-tauri/src/commands/update_check.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Check for new versions; show a banner with release notes.

## REQUIRED IMPLEMENTATION

Add to `Cargo.toml`:
```toml
tauri-plugin-updater = "2"
```

Create `product/apps/admin/src-tauri/src/commands/update_check.rs`:

```rust
use tauri_plugin_updater::UpdaterExt;
use tauri::AppHandle;
use tauri::State;
use serde::Serialize;
use crate::error::AppResult;

#[derive(Serialize)]
pub struct UpdateInfo {
    pub available: bool,
    pub current_version: String,
    pub new_version: Option<String>,
    pub release_notes: Option<String>,
}

#[tauri::command]
pub async fn check_for_update(app: AppHandle) -> AppResult<UpdateInfo> {
    let updater = app.updater();
    let current = app.package_info().version.to_string();
    match updater.check().await {
        Ok(Some(update)) => Ok(UpdateInfo {
            available: true,
            current_version: current,
            new_version: Some(update.version.clone()),
            release_notes: update.body.clone(),
        }),
        Ok(None) => Ok(UpdateInfo { available: false, current_version: current, new_version: None, release_notes: None }),
        Err(e) => Err(crate::error::AppError::Network(format!("update check: {e}"))),
    }
}
```

## TESTS

```bash
cd product
test -f apps/admin/src-tauri/src/commands/update_check.rs || { echo "FAIL"; exit 1; }
grep -q "check_for_update" apps/admin/src-tauri/src/commands/update_check.rs || { echo "FAIL"; exit 1; }
echo "OK"
```
