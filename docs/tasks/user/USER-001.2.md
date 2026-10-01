# TASK ID: USER-001.2
# TITLE: Init User Tauri Rust crate
# STATUS: pending
# DEPENDENCIES: USER-001.1
# ALLOWED FILES: product/apps/user/src-tauri/Cargo.toml, product/apps/user/src-tauri/tauri.conf.json, product/apps/user/src-tauri/build.rs, product/apps/user/src-tauri/src/lib.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Initialize the User Tauri Rust crate.

## REQUIRED IMPLEMENTATION

Create `product/apps/user/src-tauri/Cargo.toml`:

```toml
[package]
name = "product-user"
version = "0.1.0"
edition = "2021"
default-run = "product-user"

[lib]
name = "product_user_lib"
crate-type = ["staticlib", "cdylib", "rlib"]

[build-dependencies]
tauri-build = { version = "2", features = [] }

[dependencies]
tauri = { version = "2", features = [] }
tauri-plugin-dialog = "2"
tauri-plugin-fs = "2"
tauri-plugin-http = { version = "2", features = ["unsafe-headers"] }
tauri-plugin-log = "2"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
tokio = { version = "1", features = ["full"] }
sqlx = { version = "0.8", features = ["runtime-tokio", "sqlite", "macros", "chrono", "json"] }
ed25519-dalek = { version = "2", features = ["rand_core"] }
rand = "0.8"
sha2 = "0.10"
hkdf = "0.12"
hex = "0.4"
chrono = { version = "0.4", features = ["serde"] }
base64 = "0.22"
anyhow = "1"
thiserror = "1"
tracing = "0.1"
tracing-subscriber = "0.3"
futures-util = "0.3"
async-trait = "0.1"
uuid = { version = "1", features = ["v4"] }
```

Create `product/apps/user/src-tauri/build.rs`:

```rust
fn main() {
    tauri_build::build();
}
```

Create `product/apps/user/src-tauri/tauri.conf.json`:

```json
{
  "$schema": "https://schema.tauri.app/config/2",
  "productName": "Product User",
  "version": "0.1.0",
  "identifier": "local.product.user",
  "build": {
    "frontendDist": "../dist",
    "devUrl": "http://localhost:1421",
    "beforeDevCommand": "pnpm dev",
    "beforeBuildCommand": "pnpm build"
  },
  "app": {
    "windows": [
      {
        "title": "Product User",
        "width": 1024,
        "height": 768,
        "resizable": true,
        "fullscreen": false
      }
    ],
    "security": {
      "csp": "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self' ipc: http://ipc.localhost ws://*.product.local http://localhost:*"
    }
  },
  "bundle": {
    "active": true,
    "targets": ["deb", "rpm", "appimage", "msi", "dmg", "app"],
    "icon": ["icons/32x32.png", "icons/128x128.png", "icons/icon.icns", "icons/icon.ico"],
    "category": "Productivity"
  }
}
```

Create `product/apps/user/src-tauri/src/lib.rs`:

```rust
pub mod error;
pub mod state;
pub mod commands;
pub mod crypto;
pub mod sync;
pub mod db;
pub mod projection;

use tauri::Manager;

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_log::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_http::init())
        .setup(|app| {
            let paths = state::AppPaths::new(&app.handle().path())?;
            let state = state::AppState::new(paths)?;
            app.manage(state);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::ping::ping,
            commands::auth::login_user,
            commands::auth::logout_user,
            commands::sync::connect_to_admin,
            commands::sync::disconnect_from_admin,
            commands::sync::sync_now,
            commands::data::list_projection,
            commands::data::query_event_log,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

Create `product/apps/user/src-tauri/src/main.rs`:

```rust
fn main() {
    product_user_lib::run();
}
```

## TESTS

```bash
cd product
test -f apps/user/src-tauri/Cargo.toml || { echo "FAIL"; exit 1; }
test -f apps/user/src-tauri/tauri.conf.json || { echo "FAIL"; exit 1; }
test -f apps/user/src-tauri/src/lib.rs || { echo "FAIL"; exit 1; }
grep -q "product-user" apps/user/src-tauri/Cargo.toml || { echo "FAIL: no crate name"; exit 1; }
echo "OK"
```
