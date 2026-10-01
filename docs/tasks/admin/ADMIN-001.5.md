# TASK ID: ADMIN-001.5
# TITLE: Initialize plugins in lib.rs
# STATUS: pending
# DEPENDENCIES: ADMIN-001.4
# ALLOWED FILES: product/apps/admin/src-tauri/src/lib.rs, product/apps/admin/src-tauri/src/main.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
Initialize the plugins in `lib.rs`. Set up logging, the plugin manager, and the Tauri command registry.

## REQUIRED IMPLEMENTATION

Replace `product/apps/admin/src-tauri/src/lib.rs` with:

```rust
use tauri::Manager;

mod commands;
mod error;
mod state;
mod paths;

use state::AppState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_log::Builder::new()
            .level(log::LevelFilter::Info)
            .build())
        .plugin(tauri_plugin_sql::Builder::default()
            .build())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_updater::Builder::new()
            .build())
        .setup(|app| {
            // Initialize app state
            let paths = paths::AppPaths::resolve(app.handle())?;
            let state = AppState::new(paths)?;
            app.manage(state);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::ping,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

Replace `product/apps/admin/src-tauri/src/main.rs` with:

```rust
// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    product_admin_lib::run();
}
```

Create the empty stub files (will be filled in later tasks):

```bash
cd product/apps/admin/src-tauri/src
: > error.rs
: > state.rs
: > paths.rs
: > commands.rs
echo "// placeholder" > error.rs
echo "// placeholder" > state.rs
echo "// placeholder" > paths.rs
echo "// placeholder" > commands.rs
```

In `product/apps/admin/src-tauri/src/commands.rs`:

```rust
use serde::Serialize;

#[derive(Serialize)]
pub struct PongResponse {
    pub message: String,
    pub timestamp: String,
}

#[tauri::command]
pub async fn ping() -> Result<PongResponse, String> {
    Ok(PongResponse {
        message: "pong".to_string(),
        timestamp: chrono::Utc::now().to_rfc3339(),
    })
}
```

Also add `chrono` to Cargo.toml dependencies.

## TESTS

```bash
cd product
test -f apps/admin/src-tauri/src/lib.rs || { echo "FAIL: no lib.rs"; exit 1; }
test -f apps/admin/src-tauri/src/main.rs || { echo "FAIL: no main.rs"; exit 1; }
grep -q "tauri_plugin_sql" apps/admin/src-tauri/src/lib.rs || { echo "FAIL"; exit 1; }
grep -q "tauri::command" apps/admin/src-tauri/src/commands.rs || { echo "FAIL"; exit 1; }
cd apps/admin/src-tauri && cargo check --quiet 2>&1 | tail -10 || { echo "FAIL: cargo check"; exit 1; }
echo "OK"
```
