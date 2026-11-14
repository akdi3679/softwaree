# v1 Build Phases

Each phase has a definition of done (DoD). Do not move on until green.

## Phase 0 — Boot (2–3 days)

- `cargo tauri dev` opens a window
- Compose brings up Cloud + Postgres + MinIO; `/health` answers
- DoD: both apps launch clean, no errors

## Phase 1 — Local identity + project (3–4 days)

- Local signup: email, password (Argon2id), lab name, admin last name
- Ed25519 keypair in OS keychain, survives restart
- 4-field project creation (name, admin last name, vertical=food,
  business name)
- `projects/{id}/project.db` created, encrypted, migration 001 applied
- DoD: sign up, restart, project opens, DB file exists and is encrypted

## Phase 2 — Schema port (2–3 days)

- 11 tables from `02-DATA-MODEL.md` in SQLite
- Migration 001 with `events`, `outbox`, `audit_entries`,
  `laboratory_settings` at minimum
- A Rust test inserts one row in each table
- DoD: test passes, `schema_version` recorded

## Phase 3 — Command layer, first vertical slice (4–5 days)

- `commands/sample.rs::create_sample` — validate → tx → insert sample
  → append event → append audit → commit
- Idempotency key checked before tx; second call = no new rows
- `verify_audit_chain` command
- `rebuild_projection` command (ships with test)
- DoD: `create_sample` once = 1 data + 1 event + 1 audit; twice with
  same key = still 3 rows; tamper one audit row = verify fails

## Phase 4 — UI port (7–10 days)

- Pages: Setup/Auth, Dashboard, Samples, SampleForm, SampleDetail,
  Standards, Categories, Companies, Reports, Settings
- Copy from food-analyse, replace Supabase calls with `invoke`
- DoD: intake → test → result → report works end-to-end on one
  machine; every write produces data + event + audit

## Phase 5 — Module + license + backup (10–12 days)

- Extract `domain/food_lab.rs` behind `LabModule` trait
- Compile to `wasm32-wasip2`, sign (`cloud_root` only in v1)
- Load in Wasmtime, verify at load
- License TTL 30 days, 7-day grace, then read-only
- Nightly encrypted backup to MinIO; `restore_from_backup` works
- Signed installer
- DoD: module loads from signed bundle; tamper → refuse; expire →
  read-only; restore into fresh DB works

## Phase 6 — Ship to first lab (5–7 days)

- PDF report output
- 1-page onboarding doc
- Signed installers for the customer's OS
- Run one real week at the first lab without a data incident
- DoD: customer uses it daily for 7 days, zero data incidents

## Total: ~5–6 weeks focused work