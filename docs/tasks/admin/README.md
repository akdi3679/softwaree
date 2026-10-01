# ADMIN — Admin Desktop App

Micro-tasks for `product/apps/admin/`. The Tauri 2.x + React 19 desktop app that is the project's source of truth. Holds the per-project SQLite database, runs the sync engine, executes commands, and hosts the Wasmtime module runtime.

## Groups

| Group | Topic | Tasks |
|---|---|---|
| ADMIN-001 | Tauri scaffold | ADMIN-001.1 → 001.10 (10 tasks) |
| ADMIN-002 | Tauri config | ADMIN-002.1 → 002.8 (8 tasks) |
| ADMIN-003 | Rust backend foundation | ADMIN-003.1 → 003.12 (12 tasks) |
| ADMIN-004 | SQLite per project | ADMIN-004.1 → 004.10 (10 tasks) |
| ADMIN-005 | Core domain (Project, Auth, Device) | ADMIN-005.1 → 005.10 (10 tasks) |
| ADMIN-006 | Command engine | ADMIN-006.1 → 006.12 (12 tasks) |
| ADMIN-007 | Event store + outbox | ADMIN-007.1 → 007.8 (8 tasks) |
| ADMIN-008 | Sync engine (server side) | ADMIN-008.1 → 008.12 (12 tasks) |
| ADMIN-009 | User connections (our mesh/WebSocket) | ADMIN-009.1 → 009.8 (8 tasks) |
| ADMIN-010 | Wasmtime module runtime | ADMIN-010.1 → 010.10 (10 tasks) |
| ADMIN-011 | Module installer (triple verify) | ADMIN-011.1 → 011.8 (8 tasks) |
| ADMIN-012 | Backup service | ADMIN-012.1 → 012.6 (6 tasks) |
| ADMIN-013 | React frontend skeleton | ADMIN-013.1 → 013.10 (10 tasks) |
| ADMIN-014 | Auth UI flow | ADMIN-014.1 → 014.6 (6 tasks) |
| ADMIN-015 | Project picker UI | ADMIN-015.1 → 015.4 (4 tasks) |
| ADMIN-016 | Admin user/role management UI | ADMIN-016.1 → 016.6 (6 tasks) |
| ADMIN-017 | Audit UI | ADMIN-017.1 → 017.4 (4 tasks) |
| ADMIN-018 | Module management UI | ADMIN-018.1 → 018.4 (4 tasks) |
| ADMIN-019 | Build & bundle | ADMIN-019.1 → 019.6 (6 tasks) |
| ADMIN-020 | Auto-update | ADMIN-020.1 → 020.4 (4 tasks) |

## Total: 156 micro-tasks

## Order of execution

Strict numerical order. Tauri must exist before Rust backend. Rust backend before SQLite. SQLite before command engine. Command engine before events. Events before sync. Sync before user connections. Etc.

## Architecture references

- ADR-001: three-repository model
- ADR-002: Admin as source of truth
- ADR-004: global event sequence + per-user cursor
- ADR-005: one SQLite per project
- ADR-006: Wasmtime runtime
- ADR-007: triple-signed modules
- ADR-008: snapshot-on-gap recovery
- ADR-009: no offline writes in v1
- ADR-010: roll-our-own auth

## Critical invariants

1. **One SQLite per project.** Never share a database across projects.
2. **Outbox pattern mandatory.** Data + Event + Audit + Outbox in the same transaction.
3. **Authorization re-checked at delivery.** Never trust the local projection.
4. **No business logic in the React frontend.** The frontend sends commands and renders. The Rust backend is the only authority.
5. **Modules cannot escape Wasmtime.** No raw FFI, no ambient access.
6. **Triple-signature verification at every load.** Not just at install.
