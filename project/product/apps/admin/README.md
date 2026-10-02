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

Build
bash
pnpm build        # production bundle for current OS
pnpm build:debug  # debug bundle (faster)
Bundles land in src-tauri/target/release/bundle/.

Project structure
text
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
Key commands (Tauri)
ping — health check

list_local_projects — list projects in this Admin's data dir

open_project(projectId) — open a project (load into memory)

create_project(name, adminLastName, businessType, businessName) — create a new project

invite_user(projectId, email, initialRole) — issue an invitation

create_user(projectId, email, displayName, initialRole)

change_user_role, remove_user

list_audit_entries(projectId, limit, offset)

install_module(projectId, moduleId, version)

create_backup(projectId, passphrase, note)

login_admin(passphrase), logout_admin(token)

WebSocket sync
Listens on 127.0.0.1:9420 (Tailnet-bindable) for User connections.
See src/sync/server.rs.
