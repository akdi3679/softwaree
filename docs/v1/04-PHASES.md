04-PHASES.md

# v1 Build Phases

**Status:** Locked
**Amended:** review pass 2 — Phase 6 split into 6a/6b, total estimate
revised to 10–12 weeks (honest), pen-test gate added, Rust toolchain
pinned per 03-STACK §I, table count updated to 19, X25519 keypair added
to Phase 1, payment gate timing clarified, Owner Console + Phase 0
spikes added, code-signing certificates procured early

**This is the only phase map.** It replaces all earlier drafts.

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
| Phase 5 / Block 6     | Phase 6a (WASM + licence) |
| Phase 6 (was)         | Phase 6b (UI sandbox + encrypted WASM + billing) |
| Phase 7               | Phase 7  |

---

## Phase 0 — Boot + spikes (4–5 days)

- Native toolchain verified: Node, pnpm, Rust (pinned per `03-STACK §I`),
  the MSVC linker / Visual Studio Build Tools, and the WebView2 runtime.
- `pnpm tauri dev` opens a window titled "FoodLab"
- `invoke('health')` returns ok and creates a plain SQLite file
- App data path comes from Tauri's path API, not a hand-rolled `dirs` path
- **Phase 0 CSP spike (ADR-011 §4):** verify that a `srcdoc` iframe inherits
  or does not inherit the parent's CSP on WebView2 and WebKit. Decide
  `srcdoc` vs custom-protocol URL. Document the choice.
- **Phase 0 Radix spike (ADR-011 §3.1):** verify Radix dropdown, dialog,
  and tooltip render and position correctly under the CSP with
  `style-src-attr 'unsafe-inline'` permitted.
- **Phase 0 SQLCipher spike (ADR-005):** verify `VACUUM INTO` behaviour on
  the pinned SQLCipher version. Confirm `PRAGMA key = "x'hex'"` form.
  Add a ciphertext-assertion test.
- **Phase 0 Wasmtime spike:** measure cold start and memory footprint.
  Record numbers in `03-STACK.md`.
- **Code-signing certificates procured** (Apple notarization, Windows
  Authenticode EV, Linux GPG). Lead time is weeks — buy early.
- No Cloud, no Postgres, no MinIO, no Compose

**DoD:** window opens, `health` returns `db:"up"` and a real path, the file
exists on disk, `cargo check` is clean, all four spikes documented,
code-signing certificates in hand. The DB is **not encrypted yet**.

---

## Phase 1 — Local identity + project + keys (4–5 days)

- Local signup: email, password (Argon2id 64 MB), lab name, admin last name.
  Password hash stored in `admin_state.db` `local_accounts` (device-level).
- Ed25519 signing keypair + **X25519 encryption keypair** in the OS keychain,
  both survive restart.
- Random Project Master Key in keychain; random Project DB Key inside keyring
  (ADR-022 — never derived from a signing key). **No password-wrapped
  keyring copy.**
- 4-field project creation (project name, admin last name, vertical=food,
  business name) → written to `project_meta`.
- `projects/{project_id}/project.db` created, SQLCipher-encrypted.
  SQLCipher key passed in `x'hex'` form.
- `admin_state.db` created with `license_state`, `project_registry`,
  `local_accounts`, `device_keys`.
- Migration runner + genesis audit entry.
- `rusqlite` uses the `bundled-sqlcipher` feature, not plain `bundled`.

**DoD:** sign up, close, reopen, password required, project opens, file is
encrypted (opening it without the key fails), keypairs unchanged across
restarts, `admin_state.db` contains the anchor, no password-derived keys
exist anywhere in the codebase.

---

## Phase 2 — Cloud minimum + Owner Console (5–6 days)

- Native Postgres service; Hono API; modular monolith with separate
  schemas per package.
- Endpoints: `POST /v1/accounts`, `POST /v1/accounts/mfa/enroll`,
  `POST /v1/devices/register`, `POST /v1/devices/{id}/challenge`,
  `POST /v1/devices/{id}/verify`, `POST /v1/projects` (returns Escrow
  public key), `GET /v1/projects/{id}/escrow-public-key`,
  `GET /v1/projects/{id}/backups`, `GET /v1/projects/{id}/backups/latest`,
  `GET /v1/projects/{id}/backups/{backupId}`, `GET /v1/plans`,
  `POST /v1/billing/checkout`, `POST /v1/billing/webhook`,
  `POST /v1/projects/{id}/activate`, `GET /v1/projects/{id}/activation-file`,
  `POST /v1/recovery/initiate`, `POST /v1/recovery/cancel`.
- **There is no `POST /v1/projects/{id}/escrow` endpoint** — the Escrow
  public key is returned at registration and fetched on demand.
- **Owner Console (minimal v1):** read-only views of accounts, projects,
  devices, licences, payments and backup metadata; plan CRUD; module
  publish pipeline (upload → sign → ACTIVE); recovery approval queue;
  platform audit log viewer.
- **Configurable quorum** (`approvals_required` setting, default 2). Solo
  mode: 1 hardware-key approval + 24 h delay + alert (ADR-013).
- `/ops/signups` — owner-only, separate auth, not reachable by customers.
- Email notification to the owner on signup.
- App registration is async and retryable; the app works if Cloud is down.
- `.env` is actually loaded.

**DoD:** a signup on the customer machine appears in the owner inbox and
in `/ops/signups`. The Escrow public key is received and stored locally.
A plan created in the Console is assignable with no code change. A module
published in the Console is downloadable. Killing the Cloud does not stop
the desktop app.

---

## Phase 3 — Schema port (2–3 days)

- All **19 tables** from `02-DATA-MODEL.md` in migration 001
  (10 platform + 9 module). `erasure_ledger` created empty.
- `schema_version` keyed `(scope, version)`; migration 001 split into
  `platform/` and `food_lab/` directories now, so Phase 6b's move into the
  bundle is a file relocation, not a refactor.
- Platform tables created before domain tables.
- A Rust test inserts one valid row in each of the 19.
- Resolve OPEN DECISION D-1 and record it in `02-DATA-MODEL.md`.

**DoD:** 19 tables exist, the insert test passes, `schema_version(scope, version)`
recorded for both scopes, all CHECK constraints reject an invalid value, and a
`perpetual` bundle without `device_bind` is refused by the registry CHECK.

---

## Phase 4 — Command layer, first vertical slice (5–6 days)

- `events.rs`: `append_event` + **`apply_event`** (the only mutator).
- `audit.rs`: canonical JCS hash with `platform.audit.v1` tag, chain
  append, `verify_audit_chain`. Hash excludes `audit_seq` and `hash`
  fields.
- `commands/mod.rs`: the transaction wrapper from `02-DATA-MODEL.md`,
  with `command_log` inserted LAST (after `result_payload` exists),
  PK `(actor_id, idempotency_key)`, `request_hash` verified on replay.
- `commands/sample.rs::create_sample`.
- `command_log` idempotency enforced inside the tx.
- `rebuild_projection` into a scratch DB.
- CI check: no SQL write to a business table outside `commands/`.

**DoD:**
- `create_sample` once → 1 sample + 1 event + 1 audit + 1 outbox row +
  1 command_log row
- same idempotency key twice → still those rows, and the stored result is
  returned
- same key with different payload → rejected (`IdempotencyConflict`)
- kill the process mid-transaction → no partial state on restart
- tamper one audit row → `verify_audit_chain` fails and names the sequence
- **rebuild-and-diff → scratch DB is identical to live DB**
  (comparing projected business tables only — table classes defined in
  `02-DATA-MODEL.md`).

---

## Phase 5 — UI port (7–10 days)

- **10 pages:** Setup/Auth, Dashboard, Samples, SampleForm, SampleDetail,
  Standards, Categories, Companies, Reports, Settings.
- Copy from food-analyse; replace `supabase.from(...)` with `invoke(...)`.
- **All pages talk to a `HostClient` interface** (ADR-011). The Tauri
  adapter calls `invoke()` directly; the Bridge adapter (Phase 6b) will
  use `postMessage` over the iframe bridge. Same pages, two adapters.
- Parameters and ParameterDetail merge into Standards.
- Tailwind + shadcn components reused as-is.
- `record_result`, `generate_report`, `sign_report` commands.
- **PDFs generated and stored as BLOBs** inside `mod_food_lab_reports.pdf_blob`.
  `pdf_sha256`, `included_results` (frozen result ID list), and
  `content_sha256` populated at generation time.

**DoD:** intake → test → result → verdict → report → sign works end to end
on one machine, and every write produced data + event + audit in one tx.
The signed PDF is stored as a BLOB in the DB and survives backup/restore.

---

## Phase 6a — Module + license + anchor (8–10 days)

- Extract `domain/food_lab.rs` behind the `LabModule` trait.
- Compile to `wasm32-wasip2`, load in Wasmtime.
- Bundle with **all three signatures** (module_hash signed once at publish,
  bundle_hash signed per device, device_bind per device); signer is a
  **separate process** from the API.
- Verify at install and at every load; re-verify license state.
- License TTL 30 days, refresh 7 days, **grace 14 days**, monotonic anchor
  in `admin_state.db`.
- Read-only allowlist enforced exactly as `01-FLOW.md` (including
  "take local backup", "verify audit chain", "restore from corbeille denied").
- Correction/supersede commands and `rule_version` handling.
- `recompute_derived` typed operation wired into the typed-op compiler.

**The payment gate is not yet fully real in this phase** — the module
logic is compiled into the app binary until Phase 6b moves it into the
encrypted WASM bundle. The signatures and bundle format are in place;
the enforcement that matters for revenue (encrypted binary + device-bound
Content Key) lands in Phase 6b.

**DoD:** module loads from a signed bundle; flipping one byte in the
manifest → refuse; expiry → read-only with print and local backup still
working; clock set backwards → grace does not extend; anchor survives a
backup restore; a result inside `included_results` cannot be corrected
in place; correction by new row succeeds.

---

## Phase 6b — UI sandbox + encrypted WASM + billing (6–8 days)

- **UI moves into the bundle's `ui/` directory** and runs in a sandboxed
  `srcdoc` iframe (or custom-protocol URL, per the Phase 0 spike).
  Opaque origin, nonce CSP, `connect-src 'none'`, `style-src-attr 'unsafe-inline'`.
- **Bridge HostClient adapter** replaces the Tauri adapter for module UI.
  Typed `postMessage` envelope, per-load session tokens, `event.source`
  checks, schema-validated payloads.
- **Module binary is now encrypted** (`binary.wasm.enc`) with a random
  Content Key wrapped to the device's X25519 pubkey. This is when the
  payment gate becomes **fully real**: a copied bundle cannot be decrypted
  by a second device.
- Trial + subscription via the chosen provider (OPEN DECISION D-3),
  implemented against the payment provider **interface** (big-doc 03-STACK §A.1).

**DoD:** the payment gate is real — copying the encrypted WASM to a second
device fails decryption; `device_bind` fails for a different device;
expiry → read-only; pay → writes re-enabled without reinstalling; the
sandboxed iframe cannot `fetch`, `localStorage`, or reach the host DOM.

---

## Phase 7 — Backup, restore, export, ship (5–7 days)

- `BlobStore` trait; local-folder impl, then MinIO native binary or S3.
- Nightly encrypted backup: each backup generates a fresh Backup Key,
  wraps it to the project's **Escrow public key**, uploads ciphertext +
  wrapped key.
- `restore_from_backup` into a fresh DB, including **erasure-ledger
  re-application before the project becomes writable**.
- Audit chain head anchoring to Cloud (hash only).
- **Export works in every licence state** — JSON + CSV + PDF, offline, in
  read-only, in restricted mode, during grace, after expiry.
- "Take local backup" option wraps the Backup Key with Argon2id(passphrase),
  never escrowed.
- Signed installer for the customer's OS. Code-signing certificates
  procured in Phase 0 (lead time is weeks).
- 1-page onboarding doc.

**DoD:** restore into a fresh empty DB reproduces the snapshot with an
intact audit chain and the erasure ledger re-applied; the full
"laptop dies" flow in `01-FLOW.md` works end to end; a local backup
created in read-only mode is decryptable with the passphrase; export works
after licence expiry; one real lab runs one real week with zero data
incidents.

---

## Gate — External pen-test (4–6 weeks)

**Before public launch**, an external penetration test against the
production build:

- Scope: Admin app, User app (when it ships), Cloud public API, Owner
  Console, discovery, blind relay, backup and recovery, the mesh.
- Specific focus: recovery ceremony (social engineering of support),
  patch-signing key handling, app-updater signing key, module sandbox
  escapes, typed-op compiler allow-list, bundle signature verification,
  the iframe bridge.
- Findings fixed before launch.

This is not a phase of the build; it is a **gate** between Phase 7 and
public launch.

---

## Beta (4 weeks)

1–3 real food labs run v1 in production with our support. Data incidents,
UX friction, and billing issues surface here. Findings fixed before
public launch.

---

## Total

| Block | Duration |
|---|---|
| Phases 0–7 (engineering) | **10–12 weeks** for one focused engineer |
| Pen-test gate | 4–6 weeks (parallel with late beta) |
| Beta | 4 weeks |
| **Total to public launch** | **~4–5 months** |

Earlier drafts said "7–9.5 weeks engineering"; that was the best-case
sum of the phase-day counts without buffers for integration, the CSP
spike, the payment-provider integration, and the module-encryption work
in Phase 6b. The honest number is 10–12 weeks of focused engineering
for one senior engineer, plus pen-test and beta.

---

## What moves from earlier drafts

| Old claim | New claim | Why |
|---|---|---|
| Rust 1.82+ | Pinned per `03-STACK §I` at Phase 0 | Toolchain pin is a Phase 0 deliverable |
| 7-day grace | **14-day grace** | Aligned with big-doc ADR-014 |
| "Refuses to start" on deadline | **Restricted mode** | Principle 14: data never held hostage |
| 7–9.5 weeks total | **10–12 weeks engineering + pen-test + beta** | Honest estimate |
| Phase 6 = everything | **Phase 6a (module+licence) + Phase 6b (UI sandbox + encrypted WASM + billing)** | Too much in one phase |
| Password-wrapped keyring | **Removed** | Offline brute-force risk (ADR-022) |
| Escrow at creation | **Per-backup wrapping to Escrow public key** | Backup Key is random per backup |
| `test_results` table | **`mod_food_lab_results`** | Module-table prefix rule |
| `laboratory_settings` | **`mod_food_lab_settings`** | Module-table prefix rule |
| No Owner Console | **Minimal Owner Console in Phase 2** | v1 needs plan CRUD + module publish |
| No Phase 0 spikes | **Four Phase 0 spikes** | CSP, Radix, SQLCipher, Wasmtime |
| Code-signing at end | **Procured in Phase 0** | Lead time is weeks |
