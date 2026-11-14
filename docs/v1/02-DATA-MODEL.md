# v1 Data Model — 11 tables

All in `projects/{id}/project.db` (SQLite, encrypted with SQLCipher).
Translation from Postgres: enums → TEXT + CHECK, jsonb → TEXT,
uuid → TEXT (UUIDv7), timestamptz → TEXT ISO-8601, numeric → TEXT
for exact decimals.

## Tables

1. **laboratory_settings** — one row per project
   `id, lab_name, address, logo_path, report_header, report_footer,
    default_units, created_at, updated_at`

2. **profiles** — one row in v1 (the Admin)
   `id, email, password_hash, last_name, role ('admin'),
    created_at, updated_at`

3. **companies** — clients
   `id, name, contact_name, email, phone, address, notes,
    is_active, created_at, updated_at`

4. **food_categories**
   `id, name, code, description, is_active, created_at, updated_at`

5. **parameters_library** — test parameters (e.g. Total Coliforms)
   `id, name, code, unit, value_type ('numeric','less_than',
    'greater_than','nd','detected','tntc'), method, description,
    is_active, created_at, updated_at`

6. **food_standards** — ICMSF limits per (category, parameter)
   `id, category_id, parameter_id, version (int),
    sampling_plan ('presence_absence','two_class','three_class','custom'),
    n_samples, c_max, m_limit, m_upper, sample_size, analysis_method,
    is_active, created_at, updated_at`

7. **laboratory_samples** — the sample
   `id, sample_code (unique), client_id, category_id, batch_number,
    lot_size, sampling_location, sampling_method, temperature_c,
    storage_conditions, reception_date, priority, client_reference,
    status ('received','in_analysis','completed','archived'),
    created_by, created_at, updated_at`

8. **test_results**
   `id, sample_id, parameter_id, result_value, result_type,
    verdict ('compliant','compliant_marginal','non_compliant','pending'),
    limit_snapshot (jsonb-as-text: {m_limit, m_upper, n_samples,
    c_max, sampling_plan, version}), uncertainty, method_used,
    analyst_note, re_analysis_of, analyzed_by, analyzed_at,
    created_at, updated_at`

9. **sample_analysis_reports**
   `id, sample_id, report_number (unique), conclusion, signed_by,
    signed_at, pdf_path, status ('draft','signed','delivered'),
    created_at, updated_at`

10. **audit_entries**
    `id, sequence (BIGINT, monotonic per project), entity_type,
     entity_id, action ('create','update','delete','sign','rebuild'),
     actor_id, payload (jsonb-as-text), prev_hash, hash, created_at`

11. **events** + **outbox** (two tables, counted as one entry here)
    `events: id, sequence (BIGINT, global monotonic, PK), type,
     payload (jsonb-as-text), tx_id, created_at`
    `outbox: id, event_sequence, target ('none' in v1),
     status ('pending','delivered'), created_at, delivered_at`

## Rules

- Every business write goes through `commands/*.rs`
- Every command: validate → begin tx → write data → append event
  (sequence = max+1) → append audit (prev_hash = last hash) → commit
- Audit chain: `hash = sha256(prev_hash || sequence || entity_type ||
  entity_id || action || payload || created_at)`
- `idempotency_key` is checked before the tx; stored with the event
- `limit_snapshot` is written at test time so later standard changes
  don't rewrite history (matches the Postgres trigger's behavior)

## What moves from Postgres triggers to Rust

- `calculate_compliance(...)` → `domain/food_lab.rs::compute_verdict`
- `audit_logs` trigger → `audit.rs::append_audit` (called inside tx)
- Any `updated_at` trigger → set in the command handler