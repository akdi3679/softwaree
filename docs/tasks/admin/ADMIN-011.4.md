# TASK ID: ADMIN-011.4
# TITLE: Add Admin README
# STATUS: pending
# DEPENDENCIES: ADMIN-011.3
# ALLOWED FILES: product/apps/admin/README.md
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Document the Admin app.

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/README.md`:

```markdown
# Admin App

The local-first Admin device. Source of truth for project data.

## Tech stack
- Tauri 2 (Rust backend)
- React 19 + Vite 5
- TanStack Router + TanStack Query
- Tailwind CSS 4
- SQLite (per project, sqlx)

## Development

```bash
pnpm install
pnpm dev          # vite dev server (browser preview)
pnpm tauri dev    # full Tauri window
```

## Build

```bash
pnpm build        # production bundle for current OS
pnpm build:debug  # debug bundle (faster)
```

Bundles land in `src-tauri/target/release/bundle/`.

## Project structure

```
src/
  components/      # React components
  pages/           # Page components (one per route)
  hooks/           # React Query hooks
  lib/             # Helpers (query client, tauri wrappers)
  router.tsx       # TanStack Router
  main.tsx         # React entry
src-tauri/
  src/
    commands/      # Tauri command handlers
    domain/        # Core domain (User, Role, Audit)
    events/        # Event store + outbox dispatcher
    authz/         # Authorization engine
    crypto/        # Ed25519 device key, HKDF
    db/            # SQLite pool + project handle
    backup/        # Encrypted backup pipeline
    modules/       # Wasmtime runtime + installer
    sync/          # WebSocket sync engine
    state.rs       # AppState
  migrations/      # SQLite migrations
```

## Key commands (Tauri)

- `ping` — health check
- `list_local_projects` — list projects in this Admin's data dir
- `open_project(projectId)` — open a project (load into memory)
- `create_project(name, businessType)` — create a new project
- `invite_user(projectId, email, initialRole)` — issue an invitation
- `create_user(projectId, email, displayName, initialRole)`
- `change_user_role`, `remove_user`
- `list_audit_entries(projectId, limit, offset)`
- `install_module(projectId, moduleId, version)`
- `create_backup(projectId, passphrase, note)`
- `login_admin(passphrase)`, `logout_admin(token)`

## WebSocket sync

Listens on `127.0.0.1:9420` (Tailnet-bindable) for User connections.
See `src/sync/server.rs`.
```

## TESTS

```bash
cd product
test -f apps/admin/README.md || { echo "FAIL"; exit 1; }
grep -q "Tauri" apps/admin/README.md || { echo "FAIL: no Tauri mention"; exit 1; }
echo "OK"
```
