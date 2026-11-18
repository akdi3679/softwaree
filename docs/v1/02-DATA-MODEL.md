# v1 Data Model — 15 tables

All in `projects/{project_id}/project.db` (SQLite, SQLCipher-encrypted).

**5 platform tables + 10 domain tables.** Earlier drafts said "11"; the
real count was 12, and this revision adds `schema_version`, `command_log`,
and `sample_sets` → 15.

| # | Platform        | # | Domain                    |
|---|-----------------|---|---------------------------|
| 1 | schema_version  | 6 | laboratory_settings       |
| 2 | events          | 7 | profiles                  |
| 3 | command_log     | 8 | companies                 |
| 4 | audit_entries   | 9 | food_categories           |
| 5 | outbox          | 10| parameters_library        |
|   |                 | 11| food_standards            |
|   |                 | 12| sample_sets               |
|   |                 | 13| laboratory_samples        |
|   |                 | 14| test_results              |
|   |                 | 15| sample_analysis_reports   |

## Postgres → SQLite translation rules

| Postgres        | SQLite                                    |
|-----------------|-------------------------------------------|
| enum            | `TEXT` + `CHECK (col IN (...))`           |
| jsonb           | `TEXT` (canonical JSON via serde)         |
| uuid            | `TEXT` (UUIDv7)                           |
| timestamptz     | `TEXT` ISO-8601 UTC, always `Z`           |
| text[]          | `TEXT` (JSON array)                       |
| numeric         | `TEXT` for exact decimals, never REAL     |
| trigger         | moved to Rust, called inside the command tx |

## OPEN DECISION D-1 — per-result or per-lot verdict

ICMSF two-class and three-class plans decide on **n sample units with a
maximum c** — a lot-level decision. A single result can only be compared
to m and M.

This schema supports **both**, so no migration is needed either way:

- `test_results.verdict` = per-unit verdict against m / M
- `sample_sets.verdict` = lot-level verdict from n, c and the unit counts
- `laboratory_samples.sample_set_id` groups the n units of one lot

**Default in v1:** compute the per-unit verdict always. If your existing
`calculate_compliance` trigger is per-result only, leave `sample_sets`
empty and `sample_set_id` NULL — it costs nothing and Phase 6 can fill it
later. If your trigger already rolls up across units, populate
`sample_sets` from day one.

**Action:** check the existing trigger and record the answer here.

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
  sequence      INTEGER PRIMARY KEY AUTOINCREMENT,  -- atomic, gapless. NEVER max+1
  event_id      TEXT NOT NULL UNIQUE,               -- UUIDv7
  event_type    TEXT NOT NULL,                      -- 'sample.created'
  event_version INTEGER NOT NULL DEFAULT 1,         -- payload schema version
  resource_type TEXT NOT NULL,                      -- 'sample'
  resource_id   TEXT NOT NULL,
  module_id     TEXT NOT NULL,                      -- 'food-lab'
  actor_id      TEXT NOT NULL,
  project_id    TEXT NOT NULL,
  tx_id         TEXT NOT NULL,                      -- groups one command's events
  payload       TEXT NOT NULL,                      -- canonical JSON after-state
  created_at    TEXT NOT NULL
);
CREATE INDEX events_resource ON events(resource_type, resource_id);
CREATE INDEX events_module   ON events(module_id, sequence);
CREATE INDEX events_tx       ON events(tx_id);

-- Idempotency. UNIQUE is enforced INSIDE the command transaction.
CREATE TABLE command_log (
  idempotency_key TEXT PRIMARY KEY,
  command_type    TEXT NOT NULL,
  actor_id        TEXT NOT NULL,
  tx_id           TEXT NOT NULL,
  result_payload  TEXT NOT NULL,   -- a duplicate call returns THIS, not a re-execution
  created_at      TEXT NOT NULL
);

-- Hash-chained, append-only.
CREATE TABLE audit_entries (
  audit_seq      INTEGER PRIMARY KEY AUTOINCREMENT,
  event_sequence INTEGER REFERENCES events(sequence),  -- NULL for login/update/license
  entity_type    TEXT NOT NULL,
  entity_id      TEXT NOT NULL,
  action         TEXT NOT NULL CHECK(action IN (
                   'create','update','delete','sign','correction','supersede',
                   'patch','update_apply','restore','rebuild','license','login')),
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
```

## Migration 001 — domain tables

```sql
CREATE TABLE laboratory_settings (
  id            TEXT PRIMARY KEY,
  lab_name      TEXT NOT NULL,
  address       TEXT,
  logo_path     TEXT,
  report_header TEXT,
  report_footer TEXT,
  default_units TEXT,
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL
);

-- One row in v1. Role enum already includes future roles so v1.1 is additive.
CREATE TABLE profiles (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,          -- Argon2id
  last_name     TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'admin'
                CHECK(role IN ('admin','analyst','viewer','qa','auditor')),
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL
);

CREATE TABLE companies (
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  contact_name TEXT,
  email        TEXT,
  phone        TEXT,
  address      TEXT,
  notes        TEXT,
  is_active    INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0,1)),
  created_at   TEXT NOT NULL,
  updated_at   TEXT NOT NULL
);

CREATE TABLE food_categories (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  code        TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active   INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0,1)),
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);

CREATE TABLE parameters_library (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  code        TEXT NOT NULL UNIQUE,
  unit        TEXT NOT NULL,
  value_type  TEXT NOT NULL CHECK(value_type IN
              ('numeric','less_than','greater_than','nd','detected','tntc')),
  method      TEXT,
  description TEXT,
  is_active   INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0,1)),
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);

CREATE TABLE food_standards (
  id              TEXT PRIMARY KEY,
  category_id     TEXT NOT NULL REFERENCES food_categories(id),
  parameter_id    TEXT NOT NULL REFERENCES parameters_library(id),
  version         INTEGER NOT NULL,
  sampling_plan   TEXT NOT NULL CHECK(sampling_plan IN
                  ('presence_absence','two_class','three_class','custom')),
  n_samples       INTEGER,
  c_max           INTEGER,
  m_limit         TEXT,            -- exact decimal as TEXT
  m_upper         TEXT,
  sample_size     TEXT,
  analysis_method TEXT,
  is_active       INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0,1)),
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL,
  UNIQUE(category_id, parameter_id, version)
);

-- Lot-level ICMSF decision (see OPEN DECISION D-1). May stay empty in v1.
CREATE TABLE sample_sets (
  id                   TEXT PRIMARY KEY,
  set_code             TEXT NOT NULL UNIQUE,
  company_id           TEXT NOT NULL REFERENCES companies(id),
  category_id          TEXT NOT NULL REFERENCES food_categories(id),
  batch_number         TEXT,
  lot_size             INTEGER,
  n_expected           INTEGER,
  c_max                INTEGER,
  units_tested         INTEGER NOT NULL DEFAULT 0,
  units_marginal       INTEGER NOT NULL DEFAULT 0,
  units_non_compliant  INTEGER NOT NULL DEFAULT 0,
  plan_snapshot        TEXT,          -- canonical JSON of the plan at decision time
  verdict              TEXT NOT NULL DEFAULT 'pending'
                       CHECK(verdict IN ('pending','compliant','non_compliant')),
  decided_at           TEXT,
  created_at           TEXT NOT NULL,
  updated_at           TEXT NOT NULL
);

CREATE TABLE laboratory_samples (
  id                 TEXT PRIMARY KEY,
  sample_code        TEXT NOT NULL UNIQUE,
  sample_set_id      TEXT REFERENCES sample_sets(id),   -- NULL if per-result only
  client_id          TEXT NOT NULL REFERENCES companies(id),
  category_id        TEXT NOT NULL REFERENCES food_categories(id),
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
  created_by         TEXT NOT NULL REFERENCES profiles(id),
  created_at         TEXT NOT NULL,
  updated_at         TEXT NOT NULL
);
CREATE INDEX samples_client ON laboratory_samples(client_id);
CREATE INDEX samples_status ON laboratory_samples(status, reception_date);
CREATE INDEX samples_set    ON laboratory_samples(sample_set_id);

CREATE TABLE test_results (
  id              TEXT PRIMARY KEY,
  sample_id       TEXT NOT NULL REFERENCES laboratory_samples(id),
  parameter_id    TEXT NOT NULL REFERENCES parameters_library(id),
  result_value    TEXT,                    -- exact decimal or symbolic
  result_type     TEXT NOT NULL CHECK(result_type IN
                  ('numeric','less_than','greater_than','nd','detected','tntc')),
  verdict         TEXT NOT NULL DEFAULT 'pending'
                  CHECK(verdict IN
                  ('compliant','compliant_marginal','non_compliant','pending')),
  limit_snapshot  TEXT NOT NULL,           -- canonical JSON, frozen at test time
  uncertainty     TEXT,
  method_used     TEXT,
  analyst_note    TEXT,
  re_analysis_of  TEXT REFERENCES test_results(id),
  correction_of   TEXT REFERENCES test_results(id),  -- see 03-UPDATES correction policy
  analyzed_by     TEXT NOT NULL REFERENCES profiles(id),
  analyzed_at     TEXT NOT NULL,
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL
);
CREATE INDEX results_sample ON test_results(sample_id);
CREATE INDEX results_param  ON test_results(parameter_id);

CREATE TABLE sample_analysis_reports (
  id            TEXT PRIMARY KEY,
  sample_id     TEXT NOT NULL REFERENCES laboratory_samples(id),
  report_number TEXT NOT NULL UNIQUE,
  conclusion    TEXT,
  signed_by     TEXT REFERENCES profiles(id),
  signed_at     TEXT,
  pdf_path      TEXT,
  status        TEXT NOT NULL DEFAULT 'draft'
                CHECK(status IN ('draft','signed','delivered','superseded')),
  supersedes    TEXT REFERENCES sample_analysis_reports(id),
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL
);
CREATE INDEX reports_sample ON sample_analysis_reports(sample_id);
```

## `limit_snapshot` — required fields

Frozen at test time so later changes to standards or parameters never
rewrite history:

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

`rule_version` identifies the version of `compute_verdict` that produced
the verdict. It is what makes a later logic fix traceable.

## The command pipeline (every business write)

```
validate input
authorize actor
BEGIN IMMEDIATE
  INSERT INTO command_log(idempotency_key, ...)   -- UNIQUE conflict => return stored result
  append_event(tx, event)                          -- sequence via AUTOINCREMENT
  apply_event(tx, event)                           -- THE ONLY table mutator
  append_audit(tx, entry)                          -- prev_hash = last hash
  INSERT INTO outbox(event_sequence, ...)
COMMIT
```

- `apply_event` is shared by the command path and `rebuild_projection`.
  There is no second implementation of any write.
- Idempotency is enforced by the `command_log` PRIMARY KEY **inside** the
  transaction, never by a pre-transaction read.
- A duplicate call returns `command_log.result_payload`.

## Audit hash rule (canonical, unambiguous)

```
canonical_json = JCS (RFC 8785): UTF-8, sorted keys, no insignificant whitespace
entry          = the audit row WITHOUT its own `hash` field
hash           = SHA256( "foodlab.audit.v1" || prev_hash_hex || canonical_json(entry) )
prev_hash      = previous row's hash; genesis row uses 64 zeros
```

The fixed domain tag and fixed-length 64-char hex `prev_hash` make the
concatenation unambiguous. Plain `a || b || c` of variable-length fields
is forbidden — `("ab","c")` and `("a","bc")` would collide.

Genesis entry: `action='create'`, `entity_type='project'`, written at
project creation.

## Retention

- `outbox`: rows with `status='skipped'` older than 30 days are pruned by
  a nightly maintenance job. Without this the table grows forever in v1.
- `events`, `audit_entries`, `command_log`: never pruned in v1.
- Soft-deleted domain rows: `is_active=0` or status `archived`. Hard delete
  is a support action with a pre-delete snapshot.

## What moves from Postgres triggers to Rust

| Postgres                    | Rust                                              |
|-----------------------------|---------------------------------------------------|
| `calculate_compliance()`    | `domain/food_lab.rs::compute_verdict` (per unit) and `compute_set_verdict` (per lot) |
| `audit_logs` trigger        | `audit.rs::append_audit`, called inside the tx     |
| `updated_at` triggers       | set explicitly in `apply_event`                    |
| RLS policies                | authorization in the command layer                 |

Both verdict functions are called **inside** the command transaction, so
the verdict and its snapshot commit atomically with the result.