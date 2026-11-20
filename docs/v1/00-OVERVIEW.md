# v1 Overview — Food Lab, Admin-only

**Status:** Locked
**Audience:** engineers, AI agents, contractors
**Supersedes:** all earlier v1 phase maps and scope drafts

## What v1 is

A single-user desktop app (Tauri 2 + Rust + SQLite) that lets a food
laboratory run its daily work: intake a sample, assign tests, record
results, compute ICMSF compliance verdicts, generate a report, sign and
print it. One Admin device. One project. One module (food-lab).

The Cloud is a control plane: registration, device identity, key escrow,
module licensing, encrypted backups. It never stores business data.

The domain is **ported from the existing food-analyse app**, not
reinvented. The React pages survive; the data layer is replaced.

## What v1 is NOT

- No User app, no sync, no mesh, no mDNS, no WireGuard, no discovery
- No roles UI, no invitations, no multi-project UI
- No snapshot-on-gap, no relay
- No plan tiers beyond one monthly plan
- No i18n, no marketplace, no customer portal
- No Docker required for development

Each of these is additive in v1.1+. None requires changing v1's event
format, command layer, bundle format, or update mechanism. New tables
(resource_keys, blind_indexes, erasure_ledger, membership_certs,
user_projections, mesh_peers, license_state) are added via forward-only
migrations in v1.1 — the event log and command pipeline are unchanged.

## The 13 locks (non-negotiable in v1)

1. `commands/*.rs` is the only writer to business tables. CI check.
2. Every command writes data + event + audit in ONE transaction.
3. `events`, `command_log`, `outbox`, `audit_entries`, `module_registry`,
   `tombstones`, `profiles`, `schema_version` exist in migration 001.
   Module tables are prefixed `mod_food_lab_*`.

4. Storage is `projects/{project_id}/project.db`, path keyed by project_id
   even with one project.
5. `modules/food_lab/` sits behind a `LabModule` trait shaped like the future
   WASM host API, driven by a **signed manifest** declaring its tables,
   commands, queries, pages and capability grants. The host owns every write;
   the module owns pure logic. No module table FKs to a platform table.
   
6. Ed25519 signing keypair + X25519 encryption keypair in OS keychain;
   module bundle signed and verified at install AND at every load.
7. Five update wiring points exist with tests (see `03-UPDATES.md`),
   even if unused on day one.
8. Cloud is a modular monolith: `packages/{auth,projects,modules,billing,
   backups,discovery}`, separate Postgres schemas, no cross-package
   table joins, no cross-package imports except public interfaces.
9. **Bundle format carries all three signatures from day one**
   (`cloud_root`, `project_license`, `device_bind`). Format never changes
   later; only policy tightens. This is the payment gate.
10. **Events are state deltas, not notifications.** One
    `apply_event(tx, event)` is the only table mutator. Commands call it.
    `rebuild_projection` replays through the same function.
11. **Every event carries** `resource_type`, `resource_id`, `module_id`,
    `actor_id`, `project_id`, `event_version` — so v1.1 can filter by
    permission without a backfill.
12. **Backup Key escrowed (wrapped) at creation** — the Cloud holds a
    wrapped copy in assisted mode. `restore_from_backup` into a fresh DB
    is tested before shipping. No key is derived from a signing key.
13. **The module signer runs as a separate process** from the API
    (ADR-007 enforcement). Discovery is its own package with its own
    storage abstraction.

## Same shape, fewer features

| Element        | v1                                  | Final                        |
|----------------|-------------------------------------|------------------------------|
| Storage        | one SQLite file per project         | same                         |
| Writer         | `commands/*.rs` only                | same                         |
| Every write    | data + event + audit, one tx        | same                         |
| Event log      | global sequence, state deltas       | same + per-user cursors      |
| Audit          | hash-chained, canonical encoding    | same + Cloud head anchoring  |
| Outbox         | written in tx, no consumer yet      | same + dispatcher            |
| Module bundle  | **3 signatures**, verified at load  | same + user-device bundles   |
| Module runtime | trait in-process → Wasmtime         | Wasmtime                     |
| Device         | Ed25519 + X25519 in keychain        | same + replacement flow      |
| Key custody    | Backup Key escrowed at creation     | same                         |
| Cloud          | control plane, modular monolith     | same + extracted services    |
| Users          | 0 (Admin only)                      | 0..N                         |

## Counts (single source of truth)

- **17 tables** — 8 platform + 9 module (see `02-DATA-MODEL.md`)
- **10 pages** — 3 shell + 7 module-declared
- **8 phases**, 0 through 7
- **14 acceptance tests** (see `05-ACCEPTANCE.md`)
- **13 locks**

## The upgrade test

v1.1 (User app) must read v1's event log and produce a correct projection
**without a data migration**. This is not assumed — it is proven in v1 by
acceptance test #6: replay `events` into a second database and diff it
against the live one. If they differ, v1 is not a true subset and must be
fixed before shipping.