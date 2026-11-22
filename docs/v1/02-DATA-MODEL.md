02-DATA-MODEL.md
# v1 Data Model — 19 tables

All in `projects/{project_id}/project.db` (SQLite, SQLCipher-encrypted).
**10 platform tables + 9 module tables.**

`erasure_ledger` is created **empty** in migration 001. It costs one CREATE TABLE,
makes the restore path real and testable (ADR-016), and means v1.1 adds no table
here.

| #  | Platform            | #  | Module (`mod_food_lab_*`)     |
|----|---------------------|----|-------------------------------|
| 1  | schema_version      | 11 | mod_food_lab_settings         |
| 2  | project_meta        | 12 | mod_food_lab_companies        |
| 3  | events              | 13 | mod_food_lab_categories       |
| 4  | command_log         | 14 | mod_food_lab_parameters       |
| 5  | audit_entries       | 15 | mod_food_lab_standards        |
| 6  | outbox              | 16 | mod_food_lab_sample_sets      |
| 7  | module_registry     | 17 | mod_food_lab_samples          |
| 8  | profiles            | 18 | mod_food_lab_results          |
| 9  | tombstones          | 19 | mod_food_lab_reports          |
| 10 | erasure_ledger      |    |                               |

## Table classes (for acceptance test #6 precision)

| Class              | Tables                                                                 | Rule |
|--------------------|------------------------------------------------------------------------|------|
| **Projected business** | `mod_*`, `project_meta`, `profiles`, `tombstones`, `erasure_ledger` | Change **only** via `apply_event`; reproduced by replay |
| **Log**            | `events`, `audit_entries`, `command_log`, `outbox`                     | Append-only. `outbox` alone may be pruned (delivery bookkeeping) |
| **Host-state**     | `module_registry`, `schema_version`                                    | Not replayed from events |

Test #6 replays `events` through `apply_event` and asserts all *Projected business*
tables match the live database exactly. Log tables are append-only and host-state
tables are not derived from events. Quota eviction emits `tombstone.purged` and
erasure emits `resource.erased`, both through `apply_event`. A silent `DELETE` on
a Projected table would make test #6 diverge.

## Boundary rules (PRINCIPLES §8, ADR-006)

1. Every module-owned table is prefixed `mod_<module_id>_*`. `food-lab` → `mod_food_lab_*`.
2. A module table may FK to **another table in the same module**.
3. A module table may **not** FK to a platform table. Actor fields (`created_by`,
   `analyzed_by`, `signed_by`, `deleted_by`) are plain `TEXT`; the **host** validates
   the actor. This is what lets the module move to WASM with no DB access.
4. Only `commands/*.rs` writes. Inside a command, only `apply_event` mutates tables.
5. `profiles` is **platform**, not module-owned: two modules must both be able to
   reference the same actor without owning each other's tables.

## Device-level state is NOT in this file (ADR-005, ADR-014)

`project.db` holds one project. Device-scope state lives beside it in
`admin_state.db` (or JSON config), and holds:

| Table             | Purpose |
|-------------------|---------|
| `project_registry`| List of projects on this device |
| `device_keys`     | References to keychain entries (Ed25519 + X25519) |
| `license_state`   | Cached signed licence + **monotonic clock anchor** per project |
| `local_accounts`  | Email + Argon2id password hash — **offline unlock verifier only** (ADR-023) |

Putting the anchor or the password hash in `project.db` would let a project
restore roll the clock back or copy credentials into every backup.

```sql
-- admin_state.db (device-level, SQLCipher-encrypted, NOT backed up with the project)
CREATE TABLE local_accounts (
  email         TEXT PRIMARY KEY,
  password_hash TEXT NOT NULL,          -- Argon2id 64 MB; offline unlock verifier
  cloud_user_id TEXT,                   -- NULL until Cloud registration succeeds
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL
);

CREATE TABLE device_keys (
  key_id      TEXT PRIMARY KEY,         -- keychain entry reference, never the key
  algorithm   TEXT NOT NULL,            -- 'Ed25519' | 'X25519'
  public_key  TEXT NOT NULL,
  created_at  TEXT NOT NULL
);

CREATE TABLE license_state (
  project_id           TEXT PRIMARY KEY,
  plan_id              TEXT NOT NULL,
  plan_version         INTEGER NOT NULL,
  licence_jcs          TEXT NOT NULL,   -- the signed licence payload, JCS
  licence_sig          TEXT NOT NULL,   -- Ed25519, per-project licence key
  license_expiry       TEXT,            -- NULL only for a Plan 1 perpetual licence
  state                TEXT NOT NULL,   -- active|refreshing|grace|read_only|perpetual
  monotonic_anchor     TEXT NOT NULL,
  anchor_elapsed_ms    INTEGER NOT NULL DEFAULT 0,
  last_seen_cloud_time TEXT,
  anchor_source        TEXT NOT NULL,   -- 'cloud' | 'activation_file' | 'unknown'   state_revision       INTEGER NOT NULL DEFAULT 1,
  updated_at           TEXT NOT NULL
);

CREATE TABLE project_registry (
  project_id   TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  db_path      TEXT NOT NULL,
  created_at   TEXT NOT NULL
);
```

## Postgres → SQLite translation rules

| Postgres | SQLite |
|---|---|
| enum | `TEXT` + `CHECK (col IN (...))` |
| jsonb | `TEXT` — canonical JSON (JCS, RFC 8785) |
| uuid | `TEXT` (UUIDv7) |
| timestamptz | `TEXT` ISO-8601 UTC, always `Z` |
| text[] | `TEXT` (JSON array) |
| numeric | `TEXT` for exact decimals, **never REAL** |
| trigger | moved to Rust, called inside the command tx |
| blob | `BLOB` — for PDFs, logos, binary assets |

## OPEN DECISION D-1 — per-result or per-lot verdict

ICMSF two-class and three-class plans decide on **n units with a maximum c** —
a lot-level decision. A single result can only be compared to m and M.

This schema supports both, so no migration is needed either way:

- `mod_food_lab_results.verdict` = per-unit verdict against m / M
- `mod_food_lab_sample_sets.verdict` = lot verdict from n, c and the unit counts
- `mod_food_lab_samples.sample_set_id` groups the n units of one lot

**Default:** always compute the per-unit verdict. If the existing
`calculate_compliance` trigger is per-result only, leave `sample_sets` empty and
`sample_set_id` NULL. If it already rolls up across units, populate `sample_sets`
from day one. **Action:** check the trigger and record the answer here.

## RESOLVED — offline account bootstrap (ADR-023)

`local_accounts.password_hash` lives in **`admin_state.db`** (device-level),
not in `project.db`. It is an **offline unlock verifier** — a cache, not a
second owner. The Cloud account is authoritative once registered. The local
hash is reconciled on first Cloud contact. It is never used to derive
encryption keys (ADR-022). It is never copied into project backups.

---

## Migration 001 — platform tables

```sql
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- scope separates platform migrations from per-module migrations (ADR-006/007).
-- Adding a scope column later would require a table rebuild; it exists now.
CREATE TABLE schema_version (
  scope      TEXT NOT NULL,              -- 'platform' | module_id, e.g. 'food-lab'
  version    INTEGER NOT NULL,
  applied_at TEXT NOT NULL,
  PRIMARY KEY (scope, version)
);

-- The four creation fields + project identity (ADR-012, big doc).
CREATE TABLE project_meta (
  project_id      TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  admin_last_name TEXT NOT NULL,
  business_type   TEXT NOT NULL DEFAULT 'food_lab',
  business_name   TEXT NOT NULL,
  settings        TEXT NOT NULL DEFAULT '{}',   -- JCS
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL
);

-- The canonical log. Events are STATE DELTAS, not notifications.
-- NOT AUTOINCREMENT: SQLite can burn rowids on a failed insert, leaving gaps.
-- Allocation is COALESCE(MAX(sequence),0)+1 inside BEGIN IMMEDIATE (ADR-004).
CREATE TABLE events (
  sequence           INTEGER PRIMARY KEY,
  event_id           TEXT NOT NULL UNIQUE,               -- UUIDv7
  event_type         TEXT NOT NULL,                      -- 'sample.created'
  event_version      INTEGER NOT NULL DEFAULT 1,
  resource_type      TEXT NOT NULL,                      -- 'sample'
  resource_id        TEXT NOT NULL,
  module_id          TEXT NOT NULL,                      -- 'food-lab' | 'platform'
  module_version     TEXT NOT NULL DEFAULT '1.0.0',      -- replay pinning (ADR-006)
  actor_id           TEXT NOT NULL,
  project_id         TEXT NOT NULL,
  tx_id              TEXT NOT NULL,                      -- groups one command's events
  idempotency_key    TEXT NOT NULL,                      -- from command_log
  aggregate_version  INTEGER NOT NULL DEFAULT 1,         -- optimistic concurrency
  payload_format     TEXT NOT NULL DEFAULT 'jcs-plain',  -- 'jcs-plain' now; 'jcs-enc-v1' in v1.1
  supersedes_event_id TEXT,                              -- corrections reference the original
  payload            TEXT NOT NULL,                      -- JCS after-state
  created_at         TEXT NOT NULL
);
CREATE INDEX events_resource ON events(resource_type, resource_id);
CREATE INDEX events_module   ON events(module_id, sequence);
CREATE INDEX events_tx       ON events(tx_id);

-- Idempotency. PK is (actor_id, idempotency_key) so different actors
-- cannot collide. request_hash prevents key reuse with a different payload.
CREATE TABLE command_log (
  actor_id        TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  command_type    TEXT NOT NULL,
  request_hash    TEXT NOT NULL,       -- SHA-256 of the request payload
  tx_id           TEXT NOT NULL,
  result_payload  TEXT NOT NULL,       -- a duplicate returns THIS, never re-executes
  created_at      TEXT NOT NULL,
  PRIMARY KEY (actor_id, idempotency_key)
);

-- Hash-chained, append-only.
-- action is validated in Rust, NOT by a CHECK constraint, because:
--   (a) SQLite cannot ALTER a CHECK later, and
--   (b) the set grows in v1.1 (read, erase, grant, revoke, recovery, module_install).
-- This is the one table you never want to rebuild.
-- payload is METADATA ONLY — never the sensitive content itself (ADR-016).
CREATE TABLE audit_entries (
  audit_seq      INTEGER PRIMARY KEY AUTOINCREMENT,
  event_sequence INTEGER REFERENCES events(sequence),  -- NULL for login/update/license
  entity_type    TEXT NOT NULL,
  entity_id      TEXT NOT NULL,
  action         TEXT NOT NULL,        -- validated in Rust
  actor_id       TEXT NOT NULL,
  payload        TEXT NOT NULL,        -- JCS, metadata only
  prev_hash      TEXT NOT NULL,        -- genesis = 64 zeros
  hash           TEXT NOT NULL,
  created_at     TEXT NOT NULL
);
CREATE INDEX audit_entity ON audit_entries(entity_type, entity_id);

-- Written in the same tx. No consumer in v1.
CREATE TABLE outbox (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  event_sequence INTEGER NOT NULL REFERENCES events(sequence),
  target         TEXT NOT NULL DEFAULT 'none',
  status         TEXT NOT NULL DEFAULT 'skipped'
                 CHECK(status IN ('pending','delivered','skipped')),
  created_at     TEXT NOT NULL,
  delivered_at   TEXT
);
CREATE INDEX outbox_status ON outbox(status, created_at);

-- ADR-006 step 6 + ADR-007. bundle_kind allows perpetual (Plan 1) and
-- bootstrap bundles that have no project_license or device_bind signature.
CREATE TABLE module_registry (
  module_id           TEXT NOT NULL,
  version             TEXT NOT NULL,
  bundle_kind         TEXT NOT NULL DEFAULT 'licensed'
                      CHECK(bundle_kind IN ('licensed','perpetual','bootstrap')),
  status              TEXT NOT NULL DEFAULT 'pending'
                      CHECK(status IN ('pending','active','refused','revoked','superseded')),
  bundle_path         TEXT NOT NULL,
  manifest_sha256     TEXT NOT NULL,
  binary_sha256       TEXT NOT NULL,
  sig_cloud_root      TEXT NOT NULL DEFAULT '',
  sig_project_license TEXT NOT NULL DEFAULT '',
  sig_device_bind     TEXT NOT NULL DEFAULT '',
  capabilities        TEXT NOT NULL DEFAULT '{}',   -- JCS, from manifest
  license_expires_at  TEXT,                         -- NULL for perpetual/bootstrap
  verified_install_at TEXT,
  verified_load_at    TEXT,
  refusal_reason      TEXT,
  created_at          TEXT NOT NULL,
  updated_at          TEXT NOT NULL,
  PRIMARY KEY (module_id, version),
  CHECK (status <> 'active' OR (
    length(sig_cloud_root) > 0 AND
    verified_install_at IS NOT NULL AND
    (
      bundle_kind = 'bootstrap'
      OR (length(sig_project_license) > 0
          AND length(sig_device_bind) > 0
          AND (bundle_kind = 'perpetual' OR license_expires_at IS NOT NULL))
    )
  ))
);
CREATE INDEX module_status ON module_registry(status);

-- Member directory. Platform-owned so any module can reference an actor.
-- password_hash lives in admin_state.db, NOT here (ADR-023).
-- role is a simple TEXT — no CHECK constraint, because the roles/role_permissions/
-- member_roles tables (v1.1) will replace it. A CHECK here would collide.
CREATE TABLE profiles (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  last_name     TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'admin',
  cloud_user_id TEXT,                   -- NULL until Cloud registration succeeds
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL
);

-- PRINCIPLES §11 corbeille. Soft-deleted row content, held per plan quota.
-- NO hard_delete_after column: the 30-day recovery grace is a property of
-- BACKUP RETENTION (ADR-016), not a second trash can. At quota, the oldest
-- tombstone is hard-deleted immediately and its resource key destroyed.
CREATE TABLE tombstones (
  id            TEXT PRIMARY KEY,
  module_id     TEXT NOT NULL,
  entity_type   TEXT NOT NULL,
  entity_id     TEXT NOT NULL,
  payload       TEXT NOT NULL,      -- JCS of the row at deletion
  bytes         INTEGER NOT NULL DEFAULT 0,
  deleted_by    TEXT NOT NULL,
  deleted_at    TEXT NOT NULL,
  restored_at   TEXT,
  UNIQUE(module_id, entity_type, entity_id, deleted_at)
);
CREATE INDEX tombstones_quota ON tombstones(deleted_at) WHERE restored_at IS NULL;

-- Created EMPTY in v1. Makes the restore path real (ADR-016) and means v1.1
-- adds no table here. Projected: entries arrive via `resource.erased` events.
CREATE TABLE erasure_ledger (
  resource_type TEXT NOT NULL,
  resource_id   TEXT NOT NULL,
  requested_at  TEXT NOT NULL,
  basis         TEXT NOT NULL,           -- legal basis, metadata only
  requested_by  TEXT NOT NULL,           -- host-validated actor, no FK
  entry_hash    TEXT NOT NULL,
  PRIMARY KEY (resource_type, resource_id)
);
```

---

## Migration 001 — module tables (`food-lab`)

```sql
CREATE TABLE mod_food_lab_settings (
  id            TEXT PRIMARY KEY,
  lab_name      TEXT NOT NULL,
  address       TEXT,
  logo_blob     BLOB,                   -- stored IN the DB, not as a file path (ADR-016)
  logo_sha256   TEXT,
  report_header TEXT,
  report_footer TEXT,
  default_units TEXT,
  version       INTEGER NOT NULL DEFAULT 1,
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL
);

CREATE TABLE mod_food_lab_companies (
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  contact_name TEXT,
  email        TEXT,
  phone        TEXT,
  address      TEXT,
  notes        TEXT,
  is_active    INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0,1)),
  version      INTEGER NOT NULL DEFAULT 1,
  created_at   TEXT NOT NULL,
  updated_at   TEXT NOT NULL
);

CREATE TABLE mod_food_lab_categories (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  code        TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active   INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0,1)),
  version     INTEGER NOT NULL DEFAULT 1,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);

CREATE TABLE mod_food_lab_parameters (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  code        TEXT NOT NULL UNIQUE,
  unit        TEXT NOT NULL,
  value_type  TEXT NOT NULL CHECK(value_type IN
              ('numeric','less_than','greater_than','nd','detected','tntc')),
  method      TEXT,
  description TEXT,
  is_active   INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0,1)),
  version     INTEGER NOT NULL DEFAULT 1,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);

CREATE TABLE mod_food_lab_standards (
  id              TEXT PRIMARY KEY,
  category_id     TEXT NOT NULL REFERENCES mod_food_lab_categories(id),
  parameter_id    TEXT NOT NULL REFERENCES mod_food_lab_parameters(id),
  version         INTEGER NOT NULL,
  sampling_plan   TEXT NOT NULL CHECK(sampling_plan IN
                  ('presence_absence','two_class','three_class','custom')),
  n_samples       INTEGER,
  c_max           INTEGER,
  m_limit         TEXT,
  m_upper         TEXT,
  sample_size     TEXT,
  analysis_method TEXT,
  is_active       INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0,1)),
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL,
  UNIQUE(category_id, parameter_id, version)
);

-- Lot-level ICMSF decision (D-1). May stay empty in v1.
CREATE TABLE mod_food_lab_sample_sets (
  id                  TEXT PRIMARY KEY,
  set_code            TEXT NOT NULL UNIQUE,
  company_id          TEXT NOT NULL REFERENCES mod_food_lab_companies(id),
  category_id         TEXT NOT NULL REFERENCES mod_food_lab_categories(id),
  batch_number        TEXT,
  lot_size            INTEGER,
  n_expected          INTEGER,
  c_max               INTEGER,
  units_tested        INTEGER NOT NULL DEFAULT 0,
  units_marginal      INTEGER NOT NULL DEFAULT 0,
  units_non_compliant INTEGER NOT NULL DEFAULT 0,
  plan_snapshot       TEXT,                  -- JCS of the plan at decision time
  verdict             TEXT NOT NULL DEFAULT 'pending'
                      CHECK(verdict IN ('pending','compliant','non_compliant')),
  decided_at          TEXT,
  version             INTEGER NOT NULL DEFAULT 1,
  created_at          TEXT NOT NULL,
  updated_at          TEXT NOT NULL
);

CREATE TABLE mod_food_lab_samples (
  id                 TEXT PRIMARY KEY,
  sample_code        TEXT NOT NULL UNIQUE,
  sample_set_id      TEXT REFERENCES mod_food_lab_sample_sets(id),
  client_id          TEXT NOT NULL REFERENCES mod_food_lab_companies(id),
  category_id        TEXT NOT NULL REFERENCES mod_food_lab_categories(id),
  batch_number       TEXT,
  lot_size           INTEGER,
  sampling_location  TEXT,
  sampling_method    TEXT,
  temperature_c      TEXT,
  storage_conditions TEXT,
  reception_date     TEXT NOT NULL,
  priority           TEXT NOT NULL DEFAULT 'normal'
                     CHECK(priority IN ('low','normal','high','urgent')),
  client_reference   TEXT,
  status             TEXT NOT NULL DEFAULT 'received'
                     CHECK(status IN ('received','in_analysis','completed','archived')),
  created_by         TEXT NOT NULL,          -- host-validated actor, no FK
  version            INTEGER NOT NULL DEFAULT 1,
  created_at         TEXT NOT NULL,
  updated_at         TEXT NOT NULL
);
CREATE INDEX mod_food_lab_samples_client ON mod_food_lab_samples(client_id);
CREATE INDEX mod_food_lab_samples_status ON mod_food_lab_samples(status, reception_date);
CREATE INDEX mod_food_lab_samples_set    ON mod_food_lab_samples(sample_set_id);

CREATE TABLE mod_food_lab_results (
  id             TEXT PRIMARY KEY,
  sample_id      TEXT NOT NULL REFERENCES mod_food_lab_samples(id),
  parameter_id   TEXT NOT NULL REFERENCES mod_food_lab_parameters(id),
  result_value   TEXT,
  result_type    TEXT NOT NULL CHECK(result_type IN
                 ('numeric','less_than','greater_than','nd','detected','tntc')),
  verdict        TEXT NOT NULL DEFAULT 'pending'
                 CHECK(verdict IN ('compliant','compliant_marginal','non_compliant','pending')),
  limit_snapshot TEXT NOT NULL,              -- JCS, frozen at test time
  uncertainty    TEXT,
  method_used    TEXT,
  analyst_note   TEXT,
  re_analysis_of TEXT REFERENCES mod_food_lab_results(id),
  correction_of  TEXT REFERENCES mod_food_lab_results(id),
  analyzed_by    TEXT NOT NULL,              -- host-validated actor, no FK
  analyzed_at    TEXT NOT NULL,
  -- Set to 1 by apply_event when a report.signed event lists this result id.
  -- Blocks in-place mutation and recompute_derived; correction by NEW row
  -- (correction_of) is still allowed and required for ISO 17025.
  is_in_signed_report INTEGER NOT NULL DEFAULT 0 CHECK(is_in_signed_report IN (0,1)),
  version        INTEGER NOT NULL DEFAULT 1,
  created_at     TEXT NOT NULL,
  updated_at     TEXT NOT NULL
);
CREATE INDEX mod_food_lab_results_sample ON mod_food_lab_results(sample_id);
CREATE INDEX mod_food_lab_results_param  ON mod_food_lab_results(parameter_id);
CREATE INDEX mod_food_lab_results_frozen ON mod_food_lab_results(is_in_signed_report);

-- Reports: PDF stored as BLOB inside the DB (ADR-016, ADR-005).
-- included_results freezes which results were used at generation time,
-- so Rule 2 ("rows never in a signed report") can be checked (03-UPDATES).
CREATE TABLE mod_food_lab_reports (
  id               TEXT PRIMARY KEY,
  sample_id        TEXT NOT NULL REFERENCES mod_food_lab_samples(id),
  report_number    TEXT NOT NULL UNIQUE,
  conclusion       TEXT,
  pdf_blob         BLOB,                     -- the actual PDF, stored in DB
  pdf_sha256       TEXT,                     -- integrity hash
  included_results TEXT NOT NULL DEFAULT '[]', -- JSON array of result IDs, frozen at generation
  content_sha256   TEXT,                     -- hash of report content at generation time
  signed_by        TEXT,                     -- host-validated actor, no FK
  signed_at        TEXT,
  status           TEXT NOT NULL DEFAULT 'draft'
                   CHECK(status IN ('draft','signed','delivered','superseded')),
  supersedes       TEXT REFERENCES mod_food_lab_reports(id),
  version          INTEGER NOT NULL DEFAULT 1,
  created_at       TEXT NOT NULL,
  updated_at       TEXT NOT NULL,
  -- A signed report without a signer or an integrity hash is not a legal record.
  CHECK (status <> 'signed' OR (
    signed_by IS NOT NULL AND signed_at IS NOT NULL AND pdf_sha256 IS NOT NULL
  ))
);
CREATE INDEX mod_food_lab_reports_sample ON mod_food_lab_reports(sample_id);
```

---

## Module manifest (signed, ADR-006 / ADR-007)

The manifest is what makes the `LabModule` trait portable to WASM. It declares
everything the host will grant. Undeclared imports are a load failure.

Field names match the big-doc ADR-007 exactly: `module_version`, `api_version`,
`required_core_min`.

```json
{
  "module_id": "food-lab",
  "module_version": "1.0.0",
  "required_core_min": "1.0.0",
  "api_version": 1,
  "rule_version": 1,
  "binary_sha256": "<SHA-256 of plaintext binary.wasm>",
  "ciphertext_sha256": "<SHA-256 of binary.wasm.enc as delivered>",
  "ui_sha256": {
    "ui/index.html": "<SHA-256>",
    "ui/module.js": "<SHA-256>",
    "ui/module.css": "<SHA-256>"
  },
  "migrations_sha256": {
    "migrations/001.sql": "<SHA-256>"
  },
  "content_key_slot": "<Content Key wrapped to device X25519 pubkey>",
  "device_pubkey": "<this device's Ed25519 public key>",
  "project_id": "<project this bundle is licensed to>",
  "license_id": "<Cloud licence record id>",
  "license_expiry": "2026-12-15T00:00:00Z",
  "issued_at": "2026-11-20T00:00:00Z",
  "tables": [
    "mod_food_lab_settings", "mod_food_lab_companies", "mod_food_lab_categories",
    "mod_food_lab_parameters", "mod_food_lab_standards", "mod_food_lab_sample_sets",
    "mod_food_lab_samples", "mod_food_lab_results", "mod_food_lab_reports"
  ],
  "commands": [
    { "name": "create_sample",   "permission": "food-lab.sample.create",
      "writes": ["mod_food_lab_samples"],
      "events": ["sample.created"], "offline_policy": "ADMIN_REQUIRED" },
    { "name": "record_result",   "permission": "food-lab.result.record",
      "writes": ["mod_food_lab_results"],
      "events": ["result.recorded"], "offline_policy": "ADMIN_REQUIRED" },
    { "name": "correct_result",  "permission": "food-lab.result.correct",
      "writes": ["mod_food_lab_results"],
      "events": ["result.corrected"], "offline_policy": "ADMIN_REQUIRED" },
    { "name": "generate_report", "permission": "food-lab.report.generate",
      "writes": ["mod_food_lab_reports"],
      "events": ["report.generated"], "offline_policy": "ADMIN_REQUIRED" },
    { "name": "sign_report",     "permission": "food-lab.report.sign",
      "writes": ["mod_food_lab_reports"],
      "events": ["report.signed"], "offline_policy": "ADMIN_REQUIRED" },
    { "name": "supersede_report","permission": "food-lab.report.supersede",
      "writes": ["mod_food_lab_reports"],
      "events": ["report.superseded"], "offline_policy": "ADMIN_REQUIRED" }
  ],
  "queries": [
    { "name": "list_samples",  "reads": ["mod_food_lab_samples"] },
    { "name": "list_results",  "reads": ["mod_food_lab_results"] },
    { "name": "get_standards", "reads": ["mod_food_lab_standards"] }
  ],
  "pages": ["Samples","SampleForm","SampleDetail","Standards","Categories","Companies","Reports"],
  "capabilities": {
    "filesystem": "none",
    "network": "none",
    "clock": true,
    "cpu_ms": 5000,
    "memory_mb": 64,
    "max_instances": 4,
    "max_payload_bytes": 1048576
  },
  "sensitive_resources": ["sample", "result", "report"]
}
```

Shell owns 3 pages (Setup/Auth, Dashboard, Settings); the module declares 7 → **10 pages**.
Capability values match PRINCIPLES §13 exactly.

Each command carries a `permission` string (`module.resource.action`) so that
v1.1 role-based authorization does not require changing the command code.

## Bundle layout (ADR-007, amended 2026-11-20)

```
bundle/
├── manifest.json                  ← module section + binding section, JCS canonical
├── manifest.sig.cloud_root        ← signs module_hash (ONCE at publish)
├── manifest.sig.project_license   ← signs bundle_hash (per device)
├── manifest.sig.device_bind       ← Cloud signing service (per device)
├── cert_chain.pem                 ← project licence cert → Cloud root
├── binary.wasm.enc                ← AES-256-GCM encrypted module logic
├── migrations/                    ← NNN.sql, hashed in manifest
│   └── 001.sql
└── ui/                            ← signed static UI assets (React pages)
    ├── index.html
    ├── module.js
    └── module.css
```

**Only the manifest is signed.** The manifest contains `binary_sha256`,
`ciphertext_sha256`, `ui_sha256`, and `migrations_sha256`.

All three signatures verified at install **and at every load**.
`module_registry.status='active'` is impossible without them — enforced
by the CHECK constraint above, not only by lint.

**v1 note:** the `ui/` directory carries the food-lab React pages.
In Phases 3–5 (before Wasmtime), the UI is served from the app binary
via the Tauri HostClient adapter. From Phase 6b, the UI is served from
the bundle's `ui/` directory inside a sandboxed iframe via the Bridge
HostClient adapter (ADR-011). The bundle format is the same in both cases.

---

## `limit_snapshot` — required fields

Frozen at test time so later changes to standards never rewrite history:

```json
{
  "standard_id": "std_...",
  "standard_version": 3,
  "parameter_id": "par_...",
  "parameter_code": "TCOL",
  "unit": "CFU/g",
  "value_type": "numeric",
  "sampling_plan": "three_class",
  "n_samples": 5,
  "c_max": 2,
  "m_limit": "100",
  "m_upper": "1000",
  "analysis_method": "ISO 4833-1",
  "rule_version": 1,
  "computed_at": "2026-01-15T09:30:00Z"
}
```

## The command pipeline (every business write)

**Ordering matters.** `command_log` is inserted LAST, after the result
exists. The PK `(actor_id, idempotency_key)` is the concurrency backstop:
if two identical commands race, the second INSERT fails on the PK and
returns the stored result.

```text
validate input
authorize(actor, "food-lab.sample.create")     -- permission from manifest

BEGIN IMMEDIATE
  -- 1. Idempotency check (read, not write)
  SELECT result_payload FROM command_log
    WHERE actor_id = ? AND idempotency_key = ?
  → found: verify request_hash matches; if yes return stored result;
           if no → reject (same key, different request)

  -- 2. Optimistic concurrency (wired in v1, enforced in v1.1)
  check expected_version → ConflictError if stale

  -- 3. The write
  append_event(tx, event)           -- sequence = COALESCE(MAX(sequence),0)+1
  apply_event(tx, event)            -- THE ONLY table mutator
  append_audit(tx, entry)           -- prev_hash = last hash
  INSERT INTO outbox(event_sequence, ...)

  -- 4. Record the command LAST (result_payload now exists)
  INSERT INTO command_log(actor_id, idempotency_key, command_type,
                          request_hash, tx_id, result_payload, created_at)
COMMIT
```

- `apply_event` is shared by the command path and `rebuild_projection`. No second
  implementation of any write exists.
- Both verdict functions run **inside** the tx, so verdict + snapshot commit atomically
  with the result.

## Audit hash rule (canonical, unambiguous)

```text
canonical_json = JCS (RFC 8785): UTF-8, sorted keys, no insignificant whitespace
entry          = the audit row WITHOUT `audit_seq` and WITHOUT `hash`
                 (audit_seq is AUTOINCREMENT and does not exist before insert;
                  hash is what we are computing)
hash           = SHA256( "platform.audit.v1" || prev_hash_hex || canonical_json(entry) )
prev_hash      = previous row's hash; genesis row uses 64 zeros
```

The hashed fields are: `event_sequence`, `entity_type`, `entity_id`,
`action`, `actor_id`, `payload`, `prev_hash`, `created_at`.

**The tag is `platform.audit.v1`, not `foodlab.audit.v1`.** The chain covers `login`,
`license`, `update_apply`, `restore`, `security` — platform actions, not one module.
Plan 4 permits mixed modules per project. A module-scoped tag would force a tag change
later, invalidating every historical hash. **This string is frozen.**

The fixed domain tag and fixed-length 64-char hex `prev_hash` make concatenation
unambiguous. Plain `a || b || c` of variable-length fields is forbidden —
`("ab","c")` and `("a","bc")` would collide.

Genesis entry: `action='create'`, `entity_type='project'`, written at project creation.

## Retention

- `outbox`: `status='skipped'` older than 30 days pruned by nightly maintenance.
- `tombstones`: held per the **corbeille quota carried in the signed licence**
  (Plan 1+ = 5 GB). The quota is an entitlement: it is read from the verified
  licence payload, never from a local setting and never from `admin_state.db`.
  A patched local value gains nothing, because the Cloud signs the limit
  (ADR-014, ADR-021). At quota, the oldest tombstone is **hard-deleted immediately**
  and its resource key destroyed. There is no `hard_delete_after` column and no
  second trash can — the 30-day recovery grace is a property of **backup retention**
  (ADR-016), not of the tombstones table.
- `events`, `audit_entries`, `command_log`: never pruned in v1.
- Soft delete writes a `tombstones` row **and** sets `is_active=0` / status `archived`,
  in the same transaction. Restore reverses both.

## What moves from Postgres triggers to Rust

| Postgres | Rust |
|---|---|
| `calculate_compliance()` | `modules/food_lab/verdict.rs::compute_verdict` (per unit), `compute_set_verdict` (per lot) |
| `audit_logs` trigger | `audit.rs::append_audit`, inside the tx |
| `updated_at` triggers | set explicitly in `apply_event` |
| RLS policies | authorization in the command layer |
