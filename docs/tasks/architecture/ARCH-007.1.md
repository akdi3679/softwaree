# TASK ID: ARCH-007.1
# TITLE: Add architecture: Tauri-specific patterns
# STATUS: pending
# DEPENDENCIES: ADMIN-024.2
# ALLOWED FILES: docs/architecture/TAURI-PATTERNS.md
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Document the patterns we use in Tauri 2.

## REQUIRED IMPLEMENTATION

Create `docs/architecture/TAURI-PATTERNS.md`:

```markdown
# Tauri 2 Patterns

## AppState

Every Tauri app uses one global `AppState` (managed with `tauri::State`).

```rust
pub struct AppState {
    pub paths: AppPaths,
    pub device_key: Arc<RwLock<SigningKey>>,
    pub device_id: String,
    pub projects: Arc<RwLock<HashMap<String, ProjectHandle>>>,
    pub metrics: Metrics,
    pub cloud: CloudClient,
    pub mesh: MeshStatus,
    pub session_id: String,
}
```

We wrap shared data in `Arc<RwLock<_>>` or `Arc<tokio::sync::Mutex<_>>` depending
on read/write ratios.

## Command pattern

Every command takes `state: State<'_, AppState>` as the first argument.
Returns `Result<T, AppError>` so we get structured errors back to the JS side.

```rust
#[tauri::command]
pub async fn my_command(state: State<'_, AppState>, input: MyInput) -> AppResult<MyOutput> {
    // ... do work ...
    Ok(out)
}
```

Register in `main.rs`:
```rust
tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![my_command, …])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
```

## IPC

Use `invoke()` from JS, NOT raw `postMessage`. We get:
- Argument validation (JSON-Schema → Zod at the boundary)
- Type safety (TypeScript types generated from Rust structs)
- Error propagation

## Event pattern

Push events from Rust to JS via `app.emit_all("event-name", payload)`.

```rust
app.emit_all("backup-progress", json!({ "stage": "uploading", "percent": 50 }))?;
```

Listen in JS:
```typescript
import { listen } from '@tauri-apps/api/event';
listen<{stage: string; percent: number}>('backup-progress', (e) => { ... });
```

## Background tasks

Long-running tasks spawn tokio tasks at app startup:

```rust
pub fn spawn_background_tasks(state: Arc<AppState>) {
    tokio::spawn(backup_scheduler::run(state.clone()));
    tokio::spawn(outbox_dispatcher::run(state.clone()));
    tokio::spawn(heartbeat::run(state.clone()));
}
```

These run for the life of the app. They're tracked in a `tasks: Arc<Mutex<JoinHandle<_>>>`
list so we can abort them on shutdown.

## Window management

Tauri 2 has multi-window support. We use:
- Main window for normal use
- Modal windows for dialogs that block (e.g., device pairing)

```rust
let pairing = WebviewWindowBuilder::new(&app, "pairing", WebviewUrl::App("pairing.html".into()))
    .title("Pair a new device")
    .inner_size(400.0, 500.0)
    .resizable(false)
    .build()?;
```

## Plugin usage

- `tauri-plugin-sql` — we use this for the projections DB (simpler than wiring up our own connection pool). But we still use sqlx directly for the project DB (we need migrations).
- `tauri-plugin-fs` — file dialogs
- `tauri-plugin-dialog` — native dialogs
- `tauri-plugin-updater` — for the auto-updater
- `tauri-plugin-log` — for structured logging

## Anti-patterns

❌ Don't use `std::sync::Mutex` (deadlocks with tokio). Use `tokio::sync::Mutex` or `parking_lot::Mutex` (if not held across await).
❌ Don't open a new DB connection per command. Use the connection pool.
❌ Don't use `unwrap()` in commands. Always return `AppResult`.
❌ Don't emit events > 10Hz (CPU spikes). Batch them.
```

## TESTS

```bash
cd /workspace
test -f docs/architecture/TAURI-PATTERNS.md || { echo "FAIL"; exit 1; }
grep -q "AppState" docs/architecture/TAURI-PATTERNS.md || { echo "FAIL"; exit 1; }
echo "OK"
```
