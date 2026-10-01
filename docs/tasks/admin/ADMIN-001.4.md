# TASK ID: ADMIN-001.4
# TITLE: Add Tauri plugins (sql, fs, http, dialog, updater, log)
# STATUS: pending
# DEPENDENCIES: ADMIN-001.3
# ALLOWED FILES: product/apps/admin/src-tauri/Cargo.toml, product/apps/admin/src-tauri/capabilities/default.json
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
Add the Tauri 2 plugins the Admin app needs: SQLite, filesystem (scoped), HTTP, dialog, updater, logger.

## REQUIRED IMPLEMENTATION

Edit `product/apps/admin/src-tauri/Cargo.toml`. Under `[dependencies]`, add:

```toml
[dependencies]
tauri = { version = "2", features = [] }
tauri-plugin-sql = { version = "2", features = ["sqlite"] }
tauri-plugin-fs = "2"
tauri-plugin-http = { version = "2", features = ["unsafe-headers"] }
tauri-plugin-dialog = "2"
tauri-plugin-updater = "2"
tauri-plugin-log = "2"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
thiserror = "1"
anyhow = "1"
tokio = { version = "1", features = ["full"] }
```

Replace the contents of `product/apps/admin/src-tauri/capabilities/default.json` with:

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "default",
  "description": "Default permissions for the Admin app",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "core:event:default",
    "core:window:default",
    "core:webview:default",
    "core:app:default",
    "core:resources:default",
    "core:menu:default",
    "core:tray:default",
    "dialog:default",
    "fs:allow-app-write",
    "fs:allow-app-read",
    "fs:allow-app-meta",
    "http:default",
    "log:default",
    "sql:default",
    "sql:allow-load",
    "sql:allow-execute",
    "sql:allow-select",
    "sql:allow-close",
    "updater:default"
  ]
}
```

## TESTS

```bash
cd product
grep -q "tauri-plugin-sql" apps/admin/src-tauri/Cargo.toml || { echo "FAIL: no sql plugin"; exit 1; }
grep -q "tauri-plugin-fs" apps/admin/src-tauri/Cargo.toml || { echo "FAIL: no fs"; exit 1; }
grep -q "tauri-plugin-updater" apps/admin/src-tauri/Cargo.toml || { echo "FAIL: no updater"; exit 1; }
grep -q "tauri-plugin-log" apps/admin/src-tauri/Cargo.toml || { echo "FAIL: no log"; exit 1; }
test -f apps/admin/src-tauri/capabilities/default.json || { echo "FAIL: no capabilities"; exit 1; }
grep -q "updater:default" apps/admin/src-tauri/capabilities/default.json || { echo "FAIL: no updater perm"; exit 1; }
cd apps/admin/src-tauri && cargo check --quiet 2>&1 | tail -5 || { echo "FAIL: cargo check"; exit 1; }
echo "OK"
```
