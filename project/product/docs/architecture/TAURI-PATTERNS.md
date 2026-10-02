# Tauri Patterns

> **Status:** Active
> **Audience:** anyone writing frontend or backend code in apps/admin
> **Related:** 03-STACK.md (sections B and C)

Conventions for the Tauri side of the product. Follow these when adding
commands, pages, or state.

---

## 1. Command boundary

Every frontend action that reaches the Rust backend goes through a Tauri
`invoke()` call. There are no direct DB or filesystem accesses from the
frontend.

Naming convention: `<noun>_<verb>` snake_case.

    invoke('create_user', { projectId, email, displayName })
    invoke('list_users', { projectId })
    invoke('change_user_role', { userId, newRole })

The matching Rust function must be declared `#[tauri::command]` and
registered in `lib.rs::invoke_handler(tauri::generate_handler![...])`.

**Rule:** a command that is not registered in the handler will fail at
runtime with "command not found". Always register.

**Rule:** the argument name in `invoke('cmd', {projectId})` must match
the Rust parameter name exactly. Tauri does not snake_case them.

---

## 2. State access

`AppState` is managed once at startup:

    .setup(|app| {
        let paths = paths::AppPaths::resolve(app.handle())?;
        let state = AppState::new(paths)?;
        app.manage(state);
        Ok(())
    })

Commands take `state: State<'_, AppState>`.

`AppState` fields are `Arc<RwLock<...>>` or `Arc<Mutex<...>>` when
shared, plain values when per-process constants.

Never store per-request data in `AppState`. Use the transaction scope.

---

## 3. Error handling

Every command returns `AppResult<T>` where `AppResult<T> = Result<T, AppError>`.

`AppError` variants map to UI-friendly codes via `SerializableError`.
The frontend receives `{code, category, message, details?}`.

Frontend pattern:

    try {
      const result = await invoke<T>('some_command', { args });
    } catch (err) {
      // err is SerializableError
      const { code, message } = err as { code: string; message: string };
    }

**Rule:** never `unwrap()` or `expect()` in a command handler. Convert
to `AppError` and let the middleware serialize it.

**Rule:** never return `Result<T, String>` from a command. Always
`AppResult<T>`.

---

## 4. Query keys and React Query

TanStack Query keys are arrays. Convention:

    ['<domain>', '<entity>', '<projectId>', ...filters]

    ['users', 'list', projectId]
    ['medical', 'patients', projectId, search]
    ['audit', 'list', projectId, { from, to }]

**Rule:** every mutation invalidates the keys it affects. Never rely on
a manual refetch.

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['medical', 'patients'] });
    }

---

## 5. Router

TanStack Router, file convention is flat routes registered in
`src/router.tsx` as an array of `createRoute({...})`.

**Rule:** every page in `src/pages/` must be routed. A page that is not
routed is dead code and will be flagged in review.

**Rule:** route params are typed by the router. Do not read them from
`window.location`.

**Rule:** never mutate `window.history` directly.

---

## 6. Component structure

    src/components/    reusable, no data fetching
    src/pages/         one file per route, may fetch data
    src/hooks/         custom hooks (usePatients, useUsers, ...)
    src/lib/           pure utility (formatting, conversion)
    src/i18n/          translations
    src/router.tsx     route table

**Rule:** components under `src/components/` never call `invoke()`.
Data fetching lives in a hook under `src/hooks/`.

---

## 7. IPC payload limits

Tauri IPC has no built-in size limit but the WebView round-trip is not
free. Keep payloads under 1 MB.

**Rule:** for large data transfers (backups, module packages, PDFs), use
the filesystem plugin and pass a path, not the bytes.

    // BAD: pass 50MB of bytes through IPC
    await invoke('save_backup', { bytes: base64 });

    // GOOD: write to a temp file, pass the path
    const path = await invoke<string>('create_backup', { projectId });
    await fs.copyFile(path, destination);

---

## 8. Async commands

All commands that touch the DB or the network are `async fn`.

Commands that only compute are sync. Tauri handles both.

**Rule:** never `block_on` inside a command. Tauri's runtime already
drives the async commands.

Exception: `.setup()` runs synchronously; use `tauri::async_runtime::block_on`
if you must run an async init before `app.manage()`.

---

## 9. Plugin configuration

Plugins are registered in `lib.rs`. Capabilities are declared in
`capabilities/*.json`.

**Rule:** add the minimum capability for the plugin's actual use.

    // BAD: allow all fs operations
    "fs:default"

    // GOOD: allow only what's needed
    "fs:allow-read-file", "fs:allow-write-file"

---

## 10. Logging

Rust: `tracing`. Use `tracing::info!`, `tracing::warn!`, `tracing::error!`.
Structured fields go in `key = value` form:

    tracing::warn!(
        target: "search_patients",
        project_id = %project_id,
        "no open project with that id"
    );

TS: `pino` in the frontend is only used for build-time logs. The
frontend's user-visible error handling goes through `ErrorDisplay`.

**Rule:** never log secrets, tokens, or full payloads of PII events.

---

## 11. Filesystem paths

Always derive from `AppPaths`. Never hardcode paths.

    AppPaths {
        data_dir,        // OS app-data dir
        projects_dir,    // data_dir/projects
        keys_dir,        // data_dir/keys
        modules_dir,     // data_dir/modules
        logs_dir,        // data_dir/logs
        tailscale_state, // legacy - to be removed
    }

`data_dir` is resolved by Tauri. On Linux: `~/.local/share/<app>`,
Windows: `%APPDATA%\<app>`, macOS: `~/Library/Application Support/<app>`.

**Rule:** if you need a new directory, add it to `AppPaths::resolve` and
create it there.

---

## 12. Migration

SQL migrations live in `apps/*/src-tauri/migrations/`.

Naming: `NNN_description.sql`, three-digit zero-padded.

Applied by `sqlx::migrate!("./migrations")` on DB open.

**Rule:** migrations are forward-only. Never edit an applied migration.
Add a new one that fixes it.

**Rule:** never `DROP COLUMN` in a migration. Tombstone it instead
(rename to `deprecated_<name>` and stop using it).

---

## 13. Testing

- Unit: pure functions in `src/lib/` or `src/utils/`
- Hook: React Testing Library + Vitest
- Command: `#[tokio::test]` in Rust, calling the underlying function
  directly (not through Tauri IPC)
- Integration: Playwright + Tauri driver

**Rule:** a command that touches the DB gets a Rust test that exercises
it end-to-end with a temp SQLite file.

---

## 14. Common gotchas

- **Tauri argument names.** `invoke('cmd', { userId })` must match a
  Rust parameter literally named `userId`. Tauri does not translate
  camelCase to snake_case. If in doubt, name the Rust parameter the same
  as the TS one and use `#[allow(non_snake_case)]`.

- **State lock ordering.** Never hold a read lock while taking a write
  lock on the same data. Deadlock is silent.

- **Windows path separators.** Always `PathBuf`. Never string-concatenate
  with `/` or `\`.

- **WebView refresh in dev.** `Ctrl+R` does not reload the Rust backend.
  Kill and restart the Tauri dev process for backend changes.

- **`invoke_handler!` macro.** Every command listed must exist and be
  public. A typo is a compile error, not a runtime error - good.