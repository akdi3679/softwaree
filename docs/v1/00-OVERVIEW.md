# v1 Overview — Food Lab, Admin-only

**Status:** Locked
**Audience:** engineers, AI agents, contractors

## What v1 is

A single-user desktop app (Tauri + Rust + SQLite) that lets a food
laboratory run its daily work: intake a sample, assign tests, record
results, compute ICMSF compliance verdicts, generate a report, print
it. One Admin device. One project. One module (food-lab).

The Cloud is a control plane: registration, device identity, module
licensing, encrypted backups. It never stores business data.

## What v1 is NOT

- No User app, no sync, no mesh, no mDNS, no WireGuard
- No roles, no invitations, no multi-project
- No snapshot-on-gap, no discovery service, no relay
- No plan tiers beyond one monthly plan
- No i18n, no marketplace, no portal

Each of these is additive in v1.1+. None requires changing v1's data
model, command layer, or update mechanism.

## The 8 locks (non-negotiable in v1)

1. `commands/*.rs` is the only writer to business tables. CI check.
2. Every command writes data + event + audit in ONE transaction.
3. `events`, `outbox`, `audit_entries` exist in migration 001.
4. Storage is `projects/{id}/project.db`, path keyed by project_id
   (even with one project).
5. `domain/food_lab.rs` sits behind a `LabModule` trait shaped like
   the future WASM host API.
6. Ed25519 device keypair in OS keychain; module bundle is signed and
   verified at load.
7. Five update wiring points exist (see `03-UPDATES.md`), even if
   unused on day one.
8. Cloud is a modular monolith: `packages/{auth,projects,modules,
   billing,backups}`, no shared tables, no cross-package imports.

## Same shape, fewer features

| Element        | v1                              | Final                          |
|----------------|---------------------------------|--------------------------------|
| Storage        | one SQLite file per project     | same                           |
| Writer         | `commands/*.rs` only            | same                           |
| Every write    | data + event + audit, one tx    | same                           |
| Event log      | global sequence, hash-chained   | same + Cloud hash upload       |
| Outbox         | exists, no dispatcher           | exists + dispatcher            |
| Module         | trait + signed WASM             | same + project/device sigs     |
| Device         | Ed25519 in keychain             | same + replacement flow        |
| Cloud          | control plane                   | same                           |
| Users          | 0 (Admin only)                  | 0..N                           |

## The upgrade test

v1.1 (User app) must read v1's event log and produce a correct
projection WITHOUT a data migration. If it can, v1 is a true subset.
If it can't, v1 was a different architecture.