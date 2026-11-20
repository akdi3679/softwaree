# v1 Build Phases

**This is the only phase map.** It replaces the "6 phases", "6 blocks",
and earlier 0–6 drafts in the conversation.

Each phase has a definition of done (DoD). Do not move on until green.

**No Docker.** Development uses native processes only. Postgres runs as a
native service (Phase 2). MinIO is a single native binary, and until
Phase 7 the blob store is a local-folder implementation behind a
`BlobStore` trait.

| Old name              | Now      |
|-----------------------|----------|
| Phase 0 / Block 1     | Phase 0  |
| Phase 1 / Block 2     | Phase 1  |
| (Cloud, was implicit) | Phase 2  |
| Phase 2 / Block 3     | Phase 3  |
| Phase 3 / Block 4     | Phase 4  |
| Phase 4 / Block 5     | Phase 5  |
| Phase 5 / Block 6     | Phase 6  |
| Phase 6               | Phase 7  |

---

## Phase 0 — Boot (2–3 days)

- Native toolchain verified: Node, pnpm, Rust (**1.82+**), the MSVC
  linker / Visual Studio Build Tools, and the WebView2 runtime
- `pnpm tauri dev` opens a window titled "FoodLab"
- `invoke('health')` returns ok and creates a plain SQLite file
- App data path comes from Tauri's path API, not a hand-rolled `dirs` path
- No Cloud, no Postgres, no MinIO, no Compose

**DoD:** window opens, `health` returns `db:"up"` and a real path, the file
exists on disk, `cargo check` is clean. The DB is **not encrypted yet**.

---

## Phase 1 — Local identity + project (3–4 days)

- Local signup: email, password (Argon2id 64 MB), lab name, admin last name
- Ed25519 signing keypair + X25519 encryption keypair in the OS keychain,
  both survive restart
- Random Project Master Key in keychain; random Project DB Key inside keyring
  (ADR-022 — never derived from a signing key)
- 4-field project creation (project name, admin last name, vertical=food,
  business name)
- `projects/{project_id}/project.db` created, SQLCipher-encrypted
- Migration runner + genesis audit entry
- `rusqlite` uses the sqlcipher feature, not plain `bundled`

**DoD:** sign up, close, reopen, password required, project opens, file is
encrypted (opening it without the key fails), keypair unchanged across
restarts.

---

## Phase 2 — Cloud minimum (4–5 days)

- Native Postgres service; Hono API; modular monolith with separate
  schemas per package
- Endpoints: `POST /v1/accounts`, `POST /v1/devices/register`,
  `POST /v1/devices/{id}/challenge`, `POST /v1/devices/{id}/verify`,
  `POST /v1/projects`, `POST /v1/projects/{id}/escrow`
- `/ops/signups` — owner-only, separate auth, not reachable by customers
- Email notification to the owner on signup
- App registration is async and retryable; the app works if Cloud is down
- `.env` is actually loaded (this was broken in the earlier draft)

**DoD:** a signup on the customer machine appears in the owner inbox and
in `/ops/signups`. The wrapped Backup Key is stored. Killing the Cloud
does not stop the desktop app.

---

## Phase 3 — Schema port (2–3 days)

- All **17 tables** from `02-DATA-MODEL.md` in migration 001
- Platform tables created before domain tables
- A Rust test inserts one valid row in each of the 17
- Resolve OPEN DECISION D-1 and record it in `02-DATA-MODEL.md`

**DoD:** 17 tables exist, the insert test passes, `schema_version`
recorded, all CHECK constraints reject an invalid value.

---

## Phase 4 — Command layer, first vertical slice (5–6 days)

- `events.rs`: `append_event` + **`apply_event`** (the only mutator)
- `audit.rs`: canonical JCS hash, chain append, `verify_audit_chain`
- `commands/mod.rs`: the transaction wrapper from `02-DATA-MODEL.md`
- `commands/sample.rs::create_sample`
- `command_log` idempotency enforced inside the tx
- `rebuild_projection` into a scratch DB
- CI check: no SQL write to a business table outside `commands/`

**DoD:**
- `create_sample` once → 1 sample + 1 event + 1 audit + 1 outbox row
- same idempotency key twice → still those rows, and the stored result is
  returned
- kill the process mid-transaction → no partial state on restart
- tamper one audit row → `verify_audit_chain` fails and names the sequence
- **rebuild-and-diff → scratch DB is identical to live DB**

---

## Phase 5 — UI port (7–10 days)

- **10 pages:** Setup/Auth, Dashboard, Samples, SampleForm, SampleDetail,
  Standards, Categories, Companies, Reports, Settings
- Copy from food-analyse; replace `supabase.from(...)` with `invoke(...)`
- Parameters and ParameterDetail merge into Standards
- Tailwind + shadcn components reused as-is
- `record_result`, `generate_report`, `sign_report` commands

**DoD:** intake → test → result → verdict → report → sign works end to end
on one machine, and every write produced data + event + audit in one tx.

---

## Phase 6 — Module + license + billing (8–10 days)

- Extract `domain/food_lab.rs` behind the `LabModule` trait
- Compile to `wasm32-wasip2`, load in Wasmtime
- Bundle with **all three signatures**; signer is a **separate process**
- Verify at install and at every load; re-verify license state
- License TTL 30 days, refresh 7 days, grace 14 days, monotonic anchor
- Read-only allowlist enforced exactly as `01-FLOW.md`
- Trial + subscription via the chosen provider (OPEN DECISION D-3)
- Correction/supersede commands and `rule_version` handling

**DoD:** module loads from a signed bundle; flipping one byte → refuse;
copying the bundle to a second device → refuse; expiry → read-only with
print still working; clock set backwards → grace does not extend; pay →
writes re-enabled.

---

## Phase 7 — Backup, restore, ship (5–7 days)

- `BlobStore` trait; local-folder impl, then MinIO native binary or S3
- Nightly encrypted backup; `GET /v1/backups` and `GET /v1/backups/{id}`
- `restore_from_backup` into a fresh DB
- Audit chain head anchoring to Cloud (hash only)
- PDF report output
- Signed installer for the customer's OS
- 1-page onboarding doc

**DoD:** restore into a fresh empty DB reproduces the snapshot with an
intact audit chain; the full "laptop died" flow in `01-FLOW.md` works end
to end; one real lab runs one real week with zero data incidents.

---

## Total

36–48 working days ≈ **7–9.5 weeks** for one focused engineer.

Earlier drafts said "~5 weeks" and "~5–6 weeks"; the phase days never
summed to that. This total is the honest sum.