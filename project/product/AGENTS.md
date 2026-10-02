# Product — Contributing Guide

Welcome! This is the **product** repo: Admin, User, modules, and the SDK.

## Repo layout
product/
+-- apps/
¦ +-- admin/ # Tauri app (source of truth for project data)
¦ +-- user/ # Tauri app (read-only viewer)
+-- modules/ # WASM modules (Rust ? wasm32-wasip2)
¦ +-- medical-reception/
¦ +-- food-lab/
¦ +-- sdk/ # Module SDK
+-- contracts/ # Shared TypeScript + Rust types
+-- e2e/ # End-to-end tests (Playwright)  
Other repos:
- `platform-cloud/` — Cloud backend (Hono + Postgres)
- `internal-infra` — our mesh, WireGuard, Prometheus, etc.

## Build

```bash
pnpm install
cargo install --locked tauri-cli

cd apps/admin
pnpm tauri dev

cd apps/user
pnpm tauri dev

cd modules/medical-reception
cargo build --target wasm32-wasip2 --release
Test
pnpm test
cargo test --workspace
pnpm --filter @product/contracts test
pnpm --filter e2e test
Conventions
Micro-tasks: every PR is one task. See /workspace/tasks/ for the full list.

Commits: feat(scope): / fix(scope): / test(scope): / docs(scope):

No new deps without a micro-task

No breaking changes without an ADR

Architecture
Start with /workspace/docs/architecture/00-OVERVIEW.md. Then read 01-PRINCIPLES.md. Then 02-DECISIONS/.

Security
All auth, all signing, all encryption flows live in apps/admin/src-tauri/src/auth/ and apps/user/src-tauri/src/auth/.
Never bypass these. Never log secrets.

Sync protocol
The protocol between Admin and User is in /workspace/docs/architecture/SYNC-PROTOCOL.md.

Modules
Every module is WASM. It runs in Wasmtime with capability-based isolation.
See modules/sdk/README.md for the SDK.

Need help?
Slack: #product-dev

Issues: tag @maintainers

Read the docs in /workspace/docs/
