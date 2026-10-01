# ADR-005: One SQLite File Per Project

**Status:** Accepted
**Date:** 2026-07-26
**Deciders:** Architecture team

---

## Context

Plan 4 (Enterprise) allows one Account to have multiple projects. We need to decide how those projects share storage on the Admin's machine.

## Decision

**One SQLite database file per project.** Each project is fully isolated at the storage layer.

```
/var/lib/product/projects/
├── proj_a1b2c3/
│   ├── project.db          ← business tables + outbox + audit + events
│   ├── project.db-wal      ← SQLite write-ahead log
│   └── project.db-shm      ← SQLite shared memory
├── proj_d4e5f6/
│   └── project.db
└── proj_g7h8i9/
    └── project.db
```

A single Admin can host multiple project files. The Admin's project picker UI lists them. The Cloud's project registry maps `account_id → list<project_id>`.

## Consequences

### Positive

- **Strong isolation.** A corrupt `project.db` only kills that project. Migrations are per-project. Backups are per-project.
- **Easy to move a project.** Copy the `.db` file to another Admin machine (with the right key) and the project follows.
- **Easy to delete a project.** Just delete the file. The Cloud's soft-delete + per-plan-quota corbeille + 30-day hard-delete grace operates on the file level. Soft-deleted records are held per the plan quota (Plan 1: local only, Plan 2: 5 GB, Plan 3: 50 GB, Plan 4: 500 GB). When the quota is reached, the oldest soft-deleted record is hard-deleted (entering the 30-day recovery grace). Per the user's goal: "we will hold its things that make the deleted soft or hard we will hold them".
- **Easy to back up a project.** Compress, encrypt, send. The Cloud stores it as a single blob. No need to do a partial database dump.
- **Different schemas per project.** Plan 4 customers can have a different mix of modules. The file is the natural unit.
- **No cross-project queries needed.** The user explicitly wants "every project is independent."

### Negative

- **Many files.** At Plan 4 scale, a single Admin could have 10+ projects = 10+ files. Acceptable — SQLite handles thousands of files per directory fine, and the Admin's project picker is the UI.
- **No global "list all patients across all my projects" query.** This is by design. The user wants project isolation. If a customer truly needs cross-project reporting, that's a separate feature (a reporting module that reads from each project with explicit authorization).

### Neutral

- Each project file contains its own `outbox`, `audit`, `events` tables. No shared "platform" tables in the Admin's database. The Admin's own state (project list, last-known cursors for users) lives in a small separate SQLite file or in a JSON config.

## File Layout

Each project directory contains exactly:

| File | Purpose | Backup? |
|---|---|---|
| `project.db` | The whole business database | Yes |
| `project.db-wal` | SQLite WAL | Bundled with `project.db` in backup |
| `project.db-shm` | SQLite shared memory | Recreated on next open, not backed up |
| `keys/` | Project-scoped keys (encrypted at rest with device key) | Yes |
| `modules/` | Installed module WASM binaries + signatures | Yes |
| `snapshots/` | Periodic local snapshots (for fast recovery) | Yes (local only) |

The `keys/` and `modules/` directories are encrypted by the OS keychain / device key. Plain SQLite file on disk is not enough — we want encryption at rest.

## Encryption at Rest

We use **SQLite's SEE (SQLite Encryption Extension)** or **SQLCipher** for at-rest encryption. The encryption key is derived from:

```
device_key (hardware-backed) + project_id
```

The device never stores the key in plain text. On Admin start, the user authenticates (biometric / OS account) and the key is fetched from the OS keychain. The SQLite file is mounted with that key.

If the device is stolen, the thief needs the OS user account + biometric. The key is not extractable from the keychain without the right credentials.

## Migrations

Each project has its own `schema_version` table. Migrations are forward-only, run on Admin start, with a pre-migration snapshot. If a migration fails, the project file is restored from the snapshot.

The Cloud ships migrations as part of the Admin app update. The Admin applies them project-by-project, never all at once, never in a way that locks all projects at once.

## Backup

A backup of one project is:
1. Stop writes to that project (no new commands, drain outbox)
2. Snapshot the SQLite file (`VACUUM INTO` for compactness)
3. Encrypt with the project's backup key
4. Upload to Cloud (MinIO)
5. Resume writes

The whole process is per-project and non-blocking for other projects on the same Admin.

## Alternatives Considered

### One SQLite file, project_id on every row

**Pros:** one file, easy cross-project queries, one backup for all projects.
**Cons:** cross-project contamination risk, harder to move/delete individual projects, harder to host projects on different machines.
**Rejected because:** the user's "every project is independent" rule is stronger than the convenience of one file.

### One PostgreSQL instance per Admin (instead of SQLite)

**Pros:** more familiar, easier to operate for SQL developers.
**Cons:** requires running a database server on the Admin machine; heavier; not embedded; doesn't fit Tauri's "small binary" model.
**Rejected because:** the Admin is a desktop app, not a server. SQLite is the right fit.

### Per-module databases

**Pros:** maximum isolation between modules.
**Cons:** cross-module queries (patient ↔ appointment) become impossible or expensive; backup is multi-file.
**Rejected because:** it doesn't match the domain model.

## Enforcement

- The Admin's project picker reads from a single registry (file or small DB) that lists projects by ID. The Cloud is the source of truth for the registry; the Admin caches it.
- Each project's file is opened with the project's specific encryption key. Mixing up keys fails immediately at SQLite open.
- A linter rule: no SQL string can reference `proj_*` or another project's tables. Each project is its own database.
- Backup code refuses to bundle multiple projects into one blob. Each project is its own backup artifact.
