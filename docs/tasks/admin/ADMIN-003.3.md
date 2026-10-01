# TASK ID: ADMIN-003.3
# TITLE: Add tracing/logging setup
# STATUS: pending
# DEPENDENCIES: ADMIN-003.2
# ALLOWED FILES: product/apps/admin/src-tauri/src/lib.rs, product/apps/admin/src-tauri/Cargo.toml
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Replace println with structured tracing. Use tracing-subscriber for JSON output to file + pretty output to console in dev.

## REQUIRED IMPLEMENTATION

Add to `product/apps/admin/src-tauri/Cargo.toml` dependencies:

```toml
tracing = "0.1"
tracing-subscriber = { version = "0.3", features = ["env-filter", "json"] }
tracing-appender = "0.2"
```

Update `product/apps/admin/src-tauri/src/lib.rs` to initialize tracing:

```rust
use tauri::Manager;
use tracing_subscriber::EnvFilter;

mod commands;
mod error;
mod state;
mod paths;
mod log_init;

use state::AppState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let filter = EnvFilter::try_from_default_env()
        .unwrap_or_else(|_| EnvFilter::new("info,product_admin_lib=debug"));

    tauri::Builder::default()
        .plugin(tauri_plugin_log::Builder::new()
            .level(log::LevelFilter::Info)
            .build())
        // ... other plugins ...
        .setup(|app| {
            log_init::init_logging(&app.handle(), filter.clone())?;
            let paths = paths::AppPaths::resolve(app.handle())?;
            let state = AppState::new(paths)?;
            app.manage(state);
            tracing::info!(version = env!("CARGO_PKG_VERSION"), "admin app started");
            Ok(())
        })
        // ... rest ...
}
```

Create `product/apps/admin/src-tauri/src/log_init.rs`:

```rust
use std::path::Path;
use tracing_subscriber::{fmt, prelude::*, EnvFilter};
use crate::error::AppResult;

pub fn init_logging<R: tauri::Runtime>(app: &tauri::AppHandle<R>, filter: EnvFilter) -> AppResult<()> {
    let log_dir = app
        .path()
        .app_log_dir()
        .map_err(|e| crate::error::AppError::PathResolution(e.to_string()))?;
    std::fs::create_dir_all(&log_dir)?;

    let file_appender = tracing_appender::rolling::daily(&log_dir, "admin.log");
    let (file_writer, _file_guard) = tracing_appender::non_blocking(file_appender);

    tracing_subscriber::registry()
        .with(filter)
        .with(
            fmt::layer()
                .with_writer(file_writer)
                .with_ansi(false)
                .json(),
        )
        .with(
            fmt::layer()
                .with_writer(std::io::stdout)
                .with_ansi(true)
                .compact(),
        )
        .init();

    Ok(())
}
```

Note: the `_file_guard` is dropped when the function returns, which is fine — tracing holds its own reference internally.

## TESTS

```bash
cd product
grep -q "tracing = " apps/admin/src-tauri/Cargo.toml || { echo "FAIL: no tracing"; exit 1; }
test -f apps/admin/src-tauri/src/log_init.rs || { echo "FAIL: no log_init"; exit 1; }
cd apps/admin/src-tauri && cargo check --quiet 2>&1 | tail -5 || { echo "FAIL"; exit 1; }
echo "OK"
```
