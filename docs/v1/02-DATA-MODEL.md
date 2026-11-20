# v1 Data Model — 17 tables

All in `projects/{project_id}/project.db` (SQLite, SQLCipher-encrypted).
**8 platform tables + 9 module tables.**

| # | Platform | # | Module (`mod_food_lab_*`) |
|---|---|---|---|
| 1 | schema_version | 9 | mod_food_lab_settings |
| 2 | events | 10 | mod_food_lab_companies |
| 3 | command_log | 11 | mod_food_lab_categories |
| 4 | audit_entries | 12 | mod_food_lab_parameters |
| 5 | outbox | 13 | mod_food_lab_standards |
| 6 | module_registry | 14 | mod_food_lab_sample_sets |
| 7 | profiles | 15 | mod_food_lab_samples |
| 8 | tombstones | 16 | mod_food_lab_results |
|   |  | 17 | mod_food_lab_reports |

## Boundary rules (PRINCIPLES §8, ADR-006)

1. Every module-owned table is prefixed `mod_<module_id>_*`. `food-lab` → `mod_food_lab_*`.
2. A module table may FK to **another table in the same module**.
3. A module table may **not** FK to a platform table. Actor fields (`created_by`,
   `analyzed_by`, `signed_by`, `deleted_by`) are plain `TEXT`; the **host** validates
   the actor. This is what lets the module move to WASM with no DB access.
4. Only `commands/*.rs` writes. Inside a command, only `apply_event` mutates tables.
5. `profiles` is **platform**, not module-owned: two modules must both be able to
   reference the same actor without owning each other's tables.

## Device-level state is NOT in this file (ADR-005)

`project.db` holds one project. Device-scope state lives beside it in
`admin_state.db` (or JSON config), and holds: project registry, device key
reference, and the **monotonic time anchor** for license grace. Putting the
anchor here would let a project restore roll the clock back.

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

## OPEN ITEM — offline account bootstrap needs an ADR

`profiles.password_hash` exists so signup works with no network (v1 lock).
PRINCIPLES §1 assigns account identity to the Cloud. Resolution to be written
as **ADR-023**: the Cloud account is authoritative once registered; the local
Argon2id hash is an **offline unlock verifier**, reconciled on first contact —
a cache, not a second owner. Until ADR-023 exists this is a known, documented
deviation, not an approved one.

---

## Migration 001 — platform tables

```sql
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE schema_version (
  version    INTEGER PRIMARY KEY,
  applied_at TEXT NOT NULL
);

-- The canonical log. Events are STATE DELTAS, not notifications.
CREATE TABLE events (
  sequence      INTEGER PRIMARY KEY AUTOINCREMENT,  -- gapless among committed rows
  event_id      TEXT NOT NULL UNIQUE,               -- UUIDv7
  event_type    TEXT NOT NULL,                      -- 'sample.created'
  event_version INTEGER NOT NULL DEFAULT 1,
  resource_type TEXT NOT NULL,                      -- 'sample'
  resource_id   TEXT NOT NULL,
  module_id     TEXT NOT NULL,                      -- 'food-lab' | 'platform'
  actor_id      TEXT NOT NULL,
  project_id    TEXT NOT NULL,
  tx_id         TEXT NOT NULL,                      -- groups one command's events
  payload       TEXT NOT NULL,                      -- JCS after-state
  created_at    TEXT NOT NULL
);
CREATE INDEX events_resource ON events(resource_type, resource_id);
CREATE INDEX events_module   ON events(module_id, sequence);
CREATE INDEX events_tx       ON events(tx_id);

-- Idempotency. UNIQUE enforced INSIDE the command transaction.
CREATE TABLE command_log (
  idempotency_key TEXT PRIMARY KEY,
  command_type    TEXT NOT NULL,
  actor_id        TEXT NOT NULL,
  tx_id           TEXT NOT NULL,
  result_payload  TEXT NOT NULL,   -- a duplicate returns THIS, never re-executes
  created_at      TEXT NOT NULL
);

-- Hash-chained, append-only.
CREATE TABLE audit_entries (
  audit_seq      INTEGER PRIMARY KEY AUTOINCREMENT,
  event_sequence INTEGER REFERENCES events(sequence),  -- NULL for login/update/license
  entity_type    TEXT NOT NULL,
  entity_id      TEXT NOT NULL,
  action         TEXT NOT NULL CHECK(action IN (
                   'create','update','delete','restore','sign','correction','supersede',
                   'patch','update_apply','rebuild','license','login','security')),
  actor_id       TEXT NOT NULL,
  payload        TEXT NOT NULL,
  prev_hash      TEXT NOT NULL,    -- genesis = 64 zeros
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

-- ADR-006 step 6 + ADR-007. A module cannot be ACTIVE without 3 valid signatures.
CREATE TABLE module_registry (
  module_id           TEXT NOT NULL,
  version             TEXT NOT NULL,
  status              TEXT NOT NULL DEFAULT 'pending'
                      CHECK(status IN ('pending','active','refused','revoked','superseded')),
  bundle_path         TEXT NOT NULL,
  manifest_sha256     TEXT NOT NULL,
  binary_sha256       TEXT NOT NULL,
  sig_cloud_root      TEXT NOT NULL DEFAULT '',
  sig_project_license TEXT NOT NULL DEFAULT '',
  sig_device_bind     TEXT NOT NULL DEFAULT '',
  capabilities        TEXT NOT NULL DEFAULT '{}',   -- JCS, from manifest
  license_expires_at  TEXT,
  verified_install_at TEXT,
  verified_load_at    TEXT,
  refusal_reason      TEXT,
  created_at          TEXT NOT NULL,
  updated_at          TEXT NOT NULL,
  PRIMARY KEY (module_id, version),
  CHECK (status <> 'active' OR (
    length(sig_cloud_root) > 0 AND
    length(sig_project_license) > 0 AND
    length(sig_device_bind) > 0 AND
    verified_install_at IS NOT NULL AND
    license_expires_at IS NOT NULL
  ))
);
CREATE INDEX module_status ON module_registry(status);

-- Project membership + role. Platform-owned so any module can reference an actor.
CREATE TABLE profiles (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,          -- Argon2id 64 MB; offline unlock verifier
  last_name     TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'admin'
                CHECK(role IN ('admin','analyst','viewer','qa','auditor')),
  cloud_user_id TEXT,                   -- NULL until Cloud registration succeeds
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL
);

-- PRINCIPLES §11 corbeille. Soft-deleted row content, held per plan quota.
CREATE TABLE tombstones (
  id                TEXT PRIMARY KEY,
  module_id         TEXT NOT NULL,
  entity_type       TEXT NOT NULL,
  entity_id         TEXT NOT NULL,
  payload           TEXT NOT NULL,      -- JCS of the row at deletion
  bytes             INTEGER NOT NULL DEFAULT 0,
  deleted_by        TEXT NOT NULL,
  deleted_at        TEXT NOT NULL,
  restored_at       TEXT,
  hard_delete_after TEXT,               -- set when quota eviction starts 30-day grace
  UNIQUE(module_id, entity_type, entity_id, deleted_at)
);
CREATE INDEX tombstones_quota ON tombstones(deleted_at) WHERE restored_at IS NULL;
```

---

## Migration 001 — module tables (`food-lab`)

```sql
CREATE TABLE mod_food_lab_settings (
  id            TEXT PRIMARY KEY,
  lab_name      TEXT NOT NULL,
  address       TEXT,
  logo_path     TEXT,
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
  version         INTEGER NOT NULL,          -- standard version (optimistic concurrency)
  sampling_plan   TEXT NOT NULL CHECK(sampling_plan IN
                  ('presence_absence','two_class','three_class','custom')),
  n_samples       INTEGER,
  c_max           INTEGER,
  m_limit         TEXT,                      -- exact decimal as TEXT
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
  sample_set_id      TEXT REFERENCES mod_food_lab_sample_sets(id),  -- NULL if per-result
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
  result_value   TEXT,                       -- exact decimal or symbolic
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
  version        INTEGER NOT NULL DEFAULT 1,
  created_at     TEXT NOT NULL,
  updated_at     TEXT NOT NULL
);
CREATE INDEX mod_food_lab_results_sample ON mod_food_lab_results(sample_id);
CREATE INDEX mod_food_lab_results_param  ON mod_food_lab_results(parameter_id);

CREATE TABLE mod_food_lab_reports (
  id            TEXT PRIMARY KEY,
  sample_id     TEXT NOT NULL REFERENCES mod_food_lab_samples(id),
  report_number TEXT NOT NULL UNIQUE,
  conclusion    TEXT,
  signed_by     TEXT,                        -- host-validated actor, no FK
  signed_at     TEXT,
  pdf_path      TEXT,
  status        TEXT NOT NULL DEFAULT 'draft'
                CHECK(status IN ('draft','signed','delivered','superseded')),
  supersedes    TEXT REFERENCES mod_food_lab_reports(id),
  version       INTEGER NOT NULL DEFAULT 1,
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL
);
CREATE INDEX mod_food_lab_reports_sample ON mod_food_lab_reports(sample_id);
```

---

## Module manifest (signed, ADR-006)

The manifest is what makes the `LabModule` trait portable to WASM. It declares
everything the host will grant. Undeclared imports are a load failure.

```json
{
  "module_id": "food-lab",
  "version": "1.0.0",
  "required_core": ">=1.0.0 <2.0.0",
  "api_version": 1,
  "rule_version": 1,
  "binary_sha256": "<SHA-256 of plaintext binary.wasm>",
  "ciphertext_sha256": "<SHA-256 of binary.wasm.enc as delivered>",
  "ui_sha256": {
    "ui/index.html": "<SHA-256>",
    "ui/module.js": "<SHA-256>",
    "ui/module.css": "<SHA-256>"
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
    { "name": "create_sample",  "writes": ["mod_food_lab_samples"],
      "events": ["sample.created"], "offline_policy": "ADMIN_REQUIRED" },
    { "name": "record_result",  "writes": ["mod_food_lab_results"],
      "events": ["result.recorded"], "offline_policy": "ADMIN_REQUIRED" },
    { "name": "correct_result", "writes": ["mod_food_lab_results"],
      "events": ["result.corrected"], "offline_policy": "ADMIN_REQUIRED" },
    { "name": "generate_report","writes": ["mod_food_lab_reports"],
      "events": ["report.generated"], "offline_policy": "ADMIN_REQUIRED" },
    { "name": "sign_report",    "writes": ["mod_food_lab_reports"],
      "events": ["report.signed"], "offline_policy": "ADMIN_REQUIRED" },
    { "name": "supersede_report","writes": ["mod_food_lab_reports"],
      "events": ["report.superseded"], "offline_policy": "ADMIN_REQUIRED" }
  ],
  "queries": [
    { "name": "list_samples", "reads": ["mod_food_lab_samples"] },
    { "name": "list_results", "reads": ["mod_food_lab_results"] },
    { "name": "get_standards","reads": ["mod_food_lab_standards"] }
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
  }
}
```

Shell owns 3 pages (Setup/Auth, Dashboard, Settings); the module declares 7 → **10 pages**.
Capability values match PRINCIPLES §13 exactly.

## Bundle layout (ADR-007, amended 2026-11-20)

```
bundle/
├── manifest.json                  ← triple-signed (JCS canonical)
├── manifest.sig.cloud_root        ← Ed25519, Cloud root key (HSM)
├── manifest.sig.project_license   ← Ed25519, per-project licence key
├── manifest.sig.device_bind       ← Ed25519, Cloud signing service
├── cert_chain.pem                 ← project licence cert → Cloud root
├── binary.wasm.enc                ← AES-256-GCM encrypted module logic
└── ui/                            ← signed static UI assets (React pages)
    ├── index.html
    ├── module.js
    └── module.css
```

**Only the manifest is signed.** The manifest contains `binary_sha256`
(plaintext wasm hash) and `ciphertext_sha256` (encrypted blob hash), so
signing the binary separately would be redundant. The binary is encrypted
with a random Content Key wrapped to the device's X25519 public key.

`device_bind` is a Cloud signature over the tuple
`(bundle_hash, device_pubkey, project_id, license_expiry)` — a signature,
not a MAC. The device checks the signature and that `device_pubkey`
equals its own Ed25519 public key.

All three signatures verified at install **and at every load**.
`module_registry.status='active'` is impossible without them — enforced
by the CHECK constraint above, not only by lint.

**v1 note:** the `ui/` directory carries the food-lab React pages.
In Phases 3–5 (before Wasmtime), the UI is served from the app binary.
From Phase 6, the UI is served from the bundle's `ui/` directory inside
a sandboxed iframe (ADR-011). The bundle format is the same in both cases.

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

```
validate input
authorize actor
BEGIN IMMEDIATE
  INSERT INTO command_log(...)      -- UNIQUE conflict => return stored result_payload
  append_event(tx, event)           -- sequence via AUTOINCREMENT
  apply_event(tx, event)            -- THE ONLY table mutator
  append_audit(tx, entry)           -- prev_hash = last hash
  INSERT INTO outbox(event_sequence, ...)
COMMIT
```

- `apply_event` is shared by the command path and `rebuild_projection`. No second
  implementation of any write exists.
- Idempotency is enforced by the `command_log` PRIMARY KEY **inside** the transaction,
  never by a pre-transaction read.
- Both verdict functions run **inside** the tx, so verdict + snapshot commit atomically
  with the result.

## Audit hash rule (canonical, unambiguous)

```
canonical_json = JCS (RFC 8785): UTF-8, sorted keys, no insignificant whitespace
entry          = the audit row WITHOUT its own `hash` field
hash           = SHA256( "platform.audit.v1" || prev_hash_hex || canonical_json(entry) )
prev_hash      = previous row's hash; genesis row uses 64 zeros
```

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
- `tombstones`: held per plan quota (Plan 1+ = 10 GB backup quota; local corbeille
  quota set in settings). At quota, oldest soft-delete gets `hard_delete_after = now + 30 days`.
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