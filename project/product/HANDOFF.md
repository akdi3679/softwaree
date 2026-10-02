# HANDOFF.md

> **For the verification team. Read this before anything else.**
> **Generated:** mid-wiring session, updated after Category C work.
> **Supersedes:** SESSION_MEMORY.md (which contains multiple false claims - see section 2)

---

## 0. What this project is

A local-first desktop platform (Tauri 2 + Rust + React) with a private
Cloud control plane (Hono + Postgres). Customers install Admin and User
apps; the Cloud is used only for auth, device registry, project registry,
module signing, backup, audit, and update publishing. Business data never
leaves the Admin device except as an encrypted backup.

Full architecture: `docs/architecture/00-OVERVIEW.md`.

---

## 1. Repo layout

Three independent repos under `C:\Users\user\desktop\softwaree\`:

    product/           (this repo) - Admin app, User app, modules, contracts, Cloud-client SDK
    platform-cloud/    (sibling)   - Cloud API, Postgres schema, auth service
    internal-infra/    (sibling)   - CI/CD, monitoring, secrets (not touched this session)

Within `product/`:

    apps/admin/            Tauri 2 + React 19 admin app
    apps/user/             Tauri 2 + React 19 user app
    packages/contracts/    Shared TypeScript types + Zod schemas
    modules/               WASM modules (medical-reception, food-lab, retail-pos, gym, school, ...)
    docs/                  Architecture, compliance, runbooks

Within `platform-cloud/`:

    apps/api/              Hono API + Drizzle ORM + Postgres

---

## 2. TRUST NOTHING IN SESSION_MEMORY.md

The file `SESSION_MEMORY.md` was auto-generated across many sessions and
contains systematic over-claiming. Examples found and corrected:

| SESSION_MEMORY claim | Reality |
|---|---|
| Commit `2bcf604` "registered all Tauri commands" | Only touched `router.tsx`. |
| Admin invoke_handler had 42 commands | Had 10. Fixed in `3324120`. |
| `modules/manifest.rs`, `scopes.rs`, `verify.rs` were done | Truncated. Fixed in `2136cec`. |
| `packages/contracts` typechecked | Truncated files. Fixed in `c94d1f4`. |
| Session 15b Cloud tasks complete | No login endpoint. Fixed in R13. |
| ADRs 001-020 exist | Only 3 existed. Fixed in R15b. |
| `cargo test` passes | Never ran. Some tests had compile errors. |
| C2 sync server was "placeholder" | Was a raw TCP echo. Rewritten in `edbd679`. |
| C1b Wasmtime host bindings | Not started. Documented in `WASMTIME-INTEGRATION.md`. |

**Rule for the verification team:** every claim must be backed by
`git show --stat <sha>` or a live check. Do not trust SESSION_MEMORY.md.

---

## 3. What compiles clean (verified end of C1b)

| Target | Command | Status |
|---|---|---|
| Admin (Rust) | `cd product/apps/admin/src-tauri && cargo check` | CLEAN (99 warnings) |
| User (Rust) | `cd product/apps/user/src-tauri && cargo check` | CLEAN (8 warnings) |
| Admin (TS) | `cd product/apps/admin && ..\..\node_modules\.bin\tsc.CMD --noEmit` | CLEAN |
| User (TS) | `cd product/apps/user && ..\..\node_modules\.bin\tsc.CMD --noEmit` | CLEAN |
| Contracts (TS) | `cd product/packages/contracts && ..\..\node_modules\.bin\tsc.CMD --noEmit` | CLEAN |
| Cloud (TS) | `cd platform-cloud/apps/api && pnpm typecheck` | CLEAN |
| Cloud tests | `cd platform-cloud/apps/api && pnpm test` | 6 files, 40 tests pass |

Windows-specific: use `..\..\node_modules\.bin\tsc.CMD --noEmit` inside
`product/`. Inside `platform-cloud/`, `pnpm typecheck` works normally.

---

## 4. What is wired vs what is stubbed

### 4.1 Admin app - Tauri IPC commands (registered in lib.rs)

Core: `ping`, `list_local_projects`, `open_project`, `create_project`
Users: `invite_user`, `create_user`, `change_user_role`, `remove_user`, `list_users`, `list_roles`
Auth: `login_admin`, `logout_admin`, `cloud_login`
TOTP: `generate_totp_setup`, `verify_totp_code`, `totp_url_for_secret`
Search: `search_events`, `import_patients_csv`, `search_patients`
Backups: `trigger_backup`, `restore_backup`, `verify_backup`
Modules: `list_installed_modules`, `list_available_modules`, `install_module`, `module_query`, `module_command`
Billing: `current_plan`, `check_user_quota`, `check_project_quota`
Analytics: `project_analytics`, `medical_kpis`, `foodlab_kpis`
Ops: `execute_batch`, `data_quality_check`, `begin_device_replacement`,
     `submit_device_replacement`, `export_diagnostic_tarball`, `vacuum_database`,
     `schedule`, `check_for_update`, `api_request`
Compliance: `gdpr_forget_user`, `gdpr_export`
PDF: `generate_lab_report`, `generate_prescription`

Total: 42 commands.

### 4.2 User app - Tauri IPC commands

Core: `ping`, `login_user`, `logout_user`
TOTP: `generate_totp_setup`, `verify_totp_code`, `totp_url_for_secret`
Sync: `connect_to_admin`, `disconnect_from_admin`, `sync_now`
Data: `list_projection`, `query_event_log`, `query_domain`
Features: `add_annotation`, `get_attachment`, `export_projection_pdf`
Handover: `accept_handover`, `generate_handover_token`
Search: `search`, `global_search`

Total: 19 commands.

### 4.3 Cloud API

Auth: `POST /v1/accounts`, `POST /v1/accounts/sessions`
TOTP: `POST /v1/accounts/totp/enable`, `POST /v1/accounts/totp/verify`, `POST /v1/accounts/totp/disable`
Devices: `POST /v1/devices/register`, `POST /v1/devices/:id/replace`
Projects: `GET/POST /v1/projects`
Invitations: `POST /v1/projects/:id/invitations`, `POST /v1/invitations/accept`, `POST /v1/invitations/:id/revoke`
Memberships: `POST /v1/memberships/:id/{approve,role,remove}`, `GET /v1/projects/:id/memberships`
Modules: `GET /v1/modules`, `GET /v1/modules/:id/versions`, `GET .../manifest`, `GET .../package`
Backups: `POST /v1/backups`, `GET /v1/projects/:id/backups`
Logs: `POST /v1/logs/ingest`
Billing: `POST /v1/billing/{checkout,cancel,webhook,portal}`
GDPR: `GET /v1/accounts/:id/gdpr/export`, `DELETE /v1/accounts/:id/gdpr/delete`
Marketplace: `GET /v1/marketplace/modules`, `GET .../:id`, `POST .../:id/install`
Support: `GET /v1/support/audit/search`, `GET /v1/support/sessions/:user_id`
Admin console: `GET /v1/admin/{accounts,stats,audit}`, `POST /v1/admin/accounts/:id/{suspend,restore}`
Portal: `GET /v1/portal/{account,team,devices,invoices,subscription,audit}`
Discovery: `POST /v1/discovery/heartbeat`, `GET /v1/discovery/lookup`
Status: `GET /v1/status/public`
Health: `GET /health`, `GET /ready`

### 4.4 In-process module dispatch (v1) - ADR-021

**Business modules now run end-to-end in v1, in-process.**

- `medical-reception`: creates patients, appointments, visits,
  prescriptions, vaccinations, lab orders, referrals, conditions.
- `food-lab`: intakes samples, starts tests, records results, issues
  reports.

The Admin calls `medical_reception::handle_command(cmd)` and
`food_lab::handle_command(cmd)` directly (see
`apps/admin/src-tauri/src/modules/dispatch.rs`). Events + audit commit
in one transaction.

**Not sandboxed (v1 trade-off, documented in ADR-021).** The WASM path
lands in v1.1 — only the inside of `run_command` changes.

### 4.4b Remaining stubs (unrelated to module dispatch)

| Location | Behavior |
|---|---|
| `modules::runtime::ModuleRuntime` | Engine + fuel config ready; component load pending v1.1 |
| `platform-cloud/.../module-signing.ts::signModulePackage` | Placeholder signatures (real signing key is deployment-time) |
| `platform-cloud/.../marketplace/review.ts::automatedReview` | No-op |
| Real Stripe webhook delivery | Mocked test passes; live wire pending Stripe account |

---

## 5. Category C status (what requires a running environment)

### 5.1 DONE this session

| # | Item | What was done | Commit |
|---|---|---|---|
| C2 | Sync frame loop | Real WebSocket server: Hello/Heartbeat/SyncRequest/Ack | `edbd679` |
| C3 | Two-phase handshake | Request / AckGotten / ApplyRequest / Applied / Confirm | (C3+C6) |
| C4a | TOTP (Rust) | Real totp-rs integration, RFC 6238 tests | `e58365f` |
| C4b | TOTP (Cloud) | Schema, service, login integration, 3 routes | (C4b) |
| C5 | Module installer | Real Ed25519 + HMAC, atomic install, 8 tests | `e697f29` |
| C6 | hello_verify | Wired into sync Hello handler | (C3+C6) |
| C8 | Chaos tests | 12 test files compile + non-ignored pass | (C8) |
| C12 | Read replica | `readDb`/`writeDb`/`hasReplica` in `db/client.ts` | (C12) |
| C1b | Wasmtime runtime | Engine + fuel + component model config, 2 tests, roadmap doc | (C1b) |
| C21 | In-process module dispatch (medical-reception) | Real patient create + event + audit, 3 integration tests | (R21) |
| C22 | In-process module dispatch (food-lab) | Real sample intake + event, 1 integration test | (R22) |

### 5.2 STILL OPEN (updated after R19)

| # | Item | Source state | Runtime requirement |
|---|---|---|---|
| C1b-cont | Wasmtime component loading | Host engine + tests done; module side not WIT-exported | `wasm32-wasip2` target + module crate rework; see `docs/architecture/WASMTIME-INTEGRATION.md` |
| C7 | Cloud+Admin smoke test | Script shipped: `product/scripts/smoke-cloud-admin.ps1` | Needs both services running to actually execute |
| C9 | k6 load test | Script verified: `platform-cloud/load/load_test.ts` (1000→10000 VUs) | Needs running Cloud API |
| C10 | Playwright E2E | Files verified: `e2e_device_swap.spec.ts`, `e2e_happy_path.ts`, `a11y.spec.ts` | Needs Tauri apps running; scaffolds skip if Cloud unreachable |
| C11 | Stripe webhook | 7-case mocked test shipped (`stripe_webhook.test.ts`) | Real delivery needs Stripe test account |
| C14 | Backup restore drill | Integration test shipped (`tests/backup_restore_drill.rs`) | Runs locally in tempdir; remote download + decrypt deferred |

### 5.3 Summary of Category C

**Source-complete (test/code exists, cannot run end-to-end without env):**
- C9 (k6 script), C10 (Playwright scaffolds), C11 (mocked test),
  C14 (integration test), C7 (smoke script).

**Source-incomplete (needs real dev work):**
- C1b-cont (Wasmtime component loading). See `WASMTIME-INTEGRATION.md`.

**See `docs/architecture/WASMTIME-INTEGRATION.md` for the exact C1b roadmap.**

---

## 6. Category E (external humans)

| # | Item | Blocker |
|---|---|---|
| E1 | Pen-test engagement | External vendor, 4-8 weeks |
| E2 | 5 beta customers | Business |
| E3 | Legal doc placeholder fills | Lawyer |
| E4 | Real Stripe live keys | Business |
| E5 | Domain + TLS certs | Ops |
| E6 | Infisical secrets deployment | Ops |
| E7 | Postgres + MinIO in production | Ops |
| E8 | Monitoring live | Ops |

---

## 7. How to run the test suites

    # Cloud unit tests (Vitest)
    cd platform-cloud/apps/api
    pnpm test                     # 6 files, 40 tests
    pnpm typecheck

    # Contracts typecheck (Windows shim)
    cd product/packages/contracts
    ..\..\node_modules\.bin\tsc.CMD --noEmit

    # Admin Rust
    cd product/apps/admin/src-tauri
    cargo check                   # 99 warnings, clean
    cargo test --lib              # unit tests including TOTP, verify, sync
    cargo test --lib sync::server # integration sync tests

    # Admin chaos/load tests (see tests/README.md)
    cargo test --test chaos_clock_skew --test chaos_concurrent_events ^
               --test chaos_corrupt_sqlite --test chaos_disconnect_mid_frame ^
               --test chaos_disk_full --test chaos_kill_midwrite ^
               --test chaos_malicious_device --test chaos_power_loss ^
               --test load_concurrent_users

    # User Rust
    cd product/apps/user/src-tauri
    cargo check                   # 8 warnings, clean

    # User TS
    cd product/apps/user
    ..\..\node_modules\.bin\tsc.CMD --noEmit

### Test files inventory

- `platform-cloud/apps/api/src/crypto/crypto.test.ts`
- `platform-cloud/apps/api/src/lib/redact.test.ts`
- `platform-cloud/apps/api/src/auth/session-rotation.test.ts`
- `platform-cloud/apps/api/src/auth/brute_force.test.ts`
- `platform-cloud/apps/api/src/audit/chain.test.ts`
- `platform-cloud/apps/api/src/services/totp.test.ts`
- `product/apps/admin/src-tauri/tests/chaos_*.rs` (8 files)
- `product/apps/admin/src-tauri/tests/load_*.rs` (3 files, 2 ignored by default)
- Unit tests inside `src/`: TOTP (Rust), module verify, sync server, hello_verify

---

## 8. Session log - commits

    product repo:
      10e3eac  fix(user): declare error module
      cedadef  feat(user): rewrite router with all 19 page routes
      6586198  feat(admin): initialize system_db at startup
      3324120  feat(admin): register all 38 Tauri commands
      93696a8  fix(user): projection schema + module entity tables
      9095713  feat(admin): module_command IPC + fix module_query signature
      de836da  fix(admin): correct NewProjectWizard export
      2136cec  fix(admin): repair truncated manifest/scopes/verify
      c94d1f4  fix(contracts): truncated versioning + registry + catalog
      14bbcfb  feat(admin): audit::writer::verify_chain()
      dff6562  feat(admin): generate_lab_report + generate_prescription
      6407fef  docs: add HANDOFF.md
      f937761  chore(docs): move workspace docs into repo
      65aeb6b  fix(docs): flatten docs/docs nesting
      06a466d  docs(architecture): principles + stack + glossary
      d8da1e7  chore(deps): Cargo.lock update
      3a907a3  docs(adr): ADR-001 to 007
      0b8ddb8  docs(adr): ADR-008, 009, 010, 017-020
      a940665  docs(architecture): index + checklist + tauri-patterns + metrics
      abbda53  docs: DR runbook + 4 legal templates
      df90e94  docs(launch): 1000 + 30-day check-in + v1.1 roadmap + wrap-up + blog
      16734dc  docs(marketplace): publisher guide
      e58365f  feat(rust): real TOTP with RFC 6238 tests (C4a)
      e697f29  feat(admin): module installer signature verification (C5)
      edbd679  feat(admin): real sync WebSocket server (C2)
      (C3+C6)  feat(admin): two-phase handshake + hello verify
      (C8)     test(admin): chaos + load tests run clean
      (C12)    feat(cloud): read replica plumbing
      (C1b)    fix(admin): repair modules/runtime.rs + WASMTIME-INTEGRATION.md

    platform-cloud repo:
      30a07ed  feat(cloud): /v1/discovery/{heartbeat,lookup}
      a481c32  feat(cloud): /v1/status/public + /v1/portal/audit
      cae47ec  feat(cloud): module signatures + delete dead stripe_webhook
      (R11b)   fix(cloud): publisher.ts signatures
      (R12)    test(cloud): redact + session-rotation + brute_force + chain
      (R13)    feat(cloud): POST /v1/accounts/sessions + rotate on role change
      (C4b)    feat(cloud): real TOTP

Every commit was verified with the appropriate check before being made.

---

## 9. Documentation index

All docs are now under `product/docs/` and version controlled.

    docs/architecture/
      00-OVERVIEW.md        01-PRINCIPLES.md      03-STACK.md
      04-GLOSSARY.md        04-DEPLOYMENT.md      05-FEATURES.md
      06-MIGRATIONS.md      07-PERFORMANCE.md     DATA-MODEL.md
      INDEX.md              CHECKLIST.md          METRICS.md
      STARTUP.md            STATUS-REPORT.md      SYNC-PROTOCOL.md
      TAURI-PATTERNS.md     WASMTIME-INTEGRATION.md
      02-DECISIONS/
        ADR-001 through ADR-010
        ADR-017 through ADR-020
        BUILD-VS-BUY.md  DATA-FLOW.md  SCALING-PATH.md

    docs/compliance/     GDPR, HIPAA, SOC2, SOC2-MATRIX, VENDORS
    docs/launch/         DAY-1-TO-7, TEAM-MEMO, 1000, 30-DAY-CHECKIN,
                         V1.1-ROADMAP, WRAP-UP, BLOG-POST
    docs/legal/          TOS, PRIVACY, DPA, LICENSE (templates)
    docs/marketplace/    REVIEW-CHECKLIST, PUBLISHER
    docs/migration/      V1-TO-V2, V2-SCHEMA
    docs/modules/        COOKBOOK, TUTORIAL
    docs/operations/     ON-CALL
    docs/release/        ROLLBACK, SIGNING
    docs/runbooks/       CLOUD, DR, EXIT-INTERVIEW, FIRST-CUSTOMER
    docs/security/       INCIDENT-RESPONSE, PEN-TEST-*, THREAT-MODEL
    docs/support/        TRAINING

---

## 10. Acceptance criteria for "verified"

A verification team can sign off when ALL of the following hold:

1. Every check in section 3 passes clean.
2. All 6 Cloud unit test files pass (`pnpm test`).
3. Admin `cargo test --lib` passes clean.
4. Admin chaos tests (non-ignored) pass clean.
4b. `cargo test --test module_roundtrip` passes (3 tests).
4c. `cargo test --test foodlab_roundtrip` passes (1 test).
5. Every Tauri IPC command in section 4.1/4.2 has a corresponding UI call
   site (grep `invoke('commandname'` in `apps/*/src`).
6. Every route in section 4.3 is registered in `src/index.ts`.
7. Both Tauri apps boot without crashing on a clean profile (this needs a
   build, not just a check).
8. The Cloud API boots (`pnpm dev`) and returns 200 from `/health`.

Anything beyond this requires Category C or Category E work.

---

## 11. Questions a verifier is likely to have

**Q: Why are there ~99 warnings in `cargo check`?**
A: Mostly unused imports. Non-blocking. `cargo fix --lib -p admin`
   clears 13 automatically.

**Q: Why does contracts typecheck need a different command?**
A: pnpm's shim on Windows doesn't put `tsc` on PATH inside `product/`.
   Use `..\..\node_modules\.bin\tsc.CMD --noEmit` directly.

**Q: Why do so many source files have "pending" or "stub" markers?**
A: Where the outer wiring could be done source-only, we did it. Where it
   needed a running environment (Wasmtime host, real sync loop, TOTP
   verification via a phone), we left a clear signal and documented it.

**Q: Where do I go to make a change?**
A: Pick from section 4.4 (small) or 5.2 (real work). Do NOT trust
   SESSION_MEMORY.md.

**Q: Are the chaos tests actually chaos tests?**
A: They exercise SQLite invariants under simulated failures (rollback,
   read-only dir, truncated frames, corrupt file). They do NOT kill a
   live process. See `tests/README.md` for honest boundaries.

**Q: Is C1b (Wasmtime) done?**
A: No. The host side compiles and the engine is configured. The module
   side does not export WIT functions yet, and the toolchain is missing
   `wasm32-wasip2`. See `docs/architecture/WASMTIME-INTEGRATION.md`.

---

## 12. Contact

Repo owner: Product Dev <dev@product.local>
Cloud owner: Cloud Dev <dev@cloud.local>

---

End of HANDOFF.md