# Product v1.0 — AI Session Plan

> 26 sessions. Each session = 1 AI conversation. Each session = 20-30 micro-tasks.

## Universal session prompt (paste this template, fill in the variables)

```
You are a senior engineer implementing the Product platform spec.

Context files (read first, in this order):
1. /workspace/docs/architecture/00-OVERVIEW.md
2. /workspace/docs/architecture/01-PRINCIPLES.md
3. /workspace/docs/architecture/02-DECISIONS/ (skim all ADRs)
4. /workspace/product/AGENTS.md
5. /workspace/tasks/INDEX.md

Your job: implement the following tasks one by one.
For each task ID listed:
  1. Read the task file at /workspace/tasks/<phase>/<TASK_ID>.md
  2. Create the file(s) exactly as shown in the task spec
  3. Run the test command at the bottom of the task
  4. If the test passes, commit with the message shown in the task
  5. If the test fails, fix the file (do not change the test)

When all tasks are done, write a status report:
- Which tasks are done
- Which failed and why
- What I should look at next

TASKS FOR THIS SESSION:
<paste the task IDs here>

START by reading the context files, then implement tasks in order.
```

---

## Session 1 — REPO Foundation (22 tasks)

**Goal**: Scaffold the 3 repos (product, platform-cloud, internal-infra), monorepo tooling, basic CI.

**Tasks**: `REPO-001` to `REPO-022`

**Files to read first**:
- `/workspace/docs/architecture/03-STACK.md`
- `/workspace/tasks/repository/README.md` (if exists)
- `/workspace/product/AGENTS.md` (if exists)

**Files to create**: 22 files under `/workspace/{product,platform-cloud,internal-infra}/`

**Commit message pattern**: `chore(repo): <description>`

---

## Session 2 — REPO Tooling (23 tasks)

**Goal**: CI/CD, Docker, dev environment scripts, linters, formatters.

**Tasks**: `REPO-023` to `REPO-045`

**Files to read first**:
- Session 1 commit history (so you know what was built)
- `/workspace/docs/architecture/04-DEPLOYMENT.md`

---

## Session 3 — CONTRACTS Core (30 tasks)

**Goal**: Branded IDs, envelopes, base types, error types. The shared language.

**Tasks**: `CONTRACT-001` to `CONTRACT-030`

**Files to read first**:
- `/workspace/docs/architecture/03-STACK.md`
- `/workspace/docs/architecture/05-FEATURES.md`
- Existing `product/contracts/` if anything exists

**Files to create**: 30 files in `/workspace/product/contracts/src/`

---

## Session 4 — CONTRACTS Sync (30 tasks)

**Goal**: Sync types, plan definitions, module manifest, signature types.

**Tasks**: `CONTRACT-031` to `CONTRACT-060`

**Files to read first**:
- `/workspace/docs/architecture/SYNC-PROTOCOL.md`
- `/workspace/docs/architecture/02-DECISIONS/ADR-005-modules.md` (if exists)
- Existing `product/contracts/src/sync/` from Session 3

---

## Session 5 — CONTRACTS SDK (30 tasks)

**Goal**: Zod schemas, OpenAPI, TypeScript SDK, Cloud client.

**Tasks**: `CONTRACT-061` to `CONTRACT-090`

**Files to read first**:
- `/workspace/docs/architecture/SYNC-PROTOCOL.md` (sections on frame format)
- `/workspace/product/contracts/src/` (everything from Sessions 3-4)

---

## Session 6 — CLOUD Backend (26 tasks)

**Goal**: Full Hono HTTP API. Accounts, auth, projects, devices, modules, backups, Stripe.

**Tasks**: `CLOUD-001` to `CLOUD-026`

**Files to read first**:
- `/workspace/docs/architecture/03-STACK.md` (Hono section)
- `/workspace/docs/architecture/04-DEPLOYMENT.md`
- `/workspace/product/contracts/src/` (use the types)

**Files to create**: 26 files in `/workspace/platform-cloud/src/`

---

## Session 7 — ADMIN Foundation (30 tasks)

**Goal**: Tauri 2 app scaffold, Rust backend, crypto, SQLite, migrations, AppState.

**Tasks**: `ADMIN-001` to `ADMIN-030`

**Files to read first**:
- `/workspace/docs/architecture/03-STACK.md` (Tauri section)
- `/workspace/docs/architecture/06-MIGRATIONS.md`
- `/workspace/product/contracts/src/` (for types)

**Files to create**: 30 files in `/workspace/product/admin/`

---

## Session 8 — ADMIN Domain (30 tasks)

**Goal**: Event store, command engine, audit hash chain, outbox dispatcher, user authz.

**Tasks**: `ADMIN-031` to `ADMIN-060`

**Files to read first**:
- Session 7's commit history
- `/workspace/docs/architecture/SYNC-PROTOCOL.md` (event envelope section)
- `/workspace/docs/compliance/HIPAA.md` (audit retention)

---

## Session 9 — ADMIN UI (35 tasks)

**Goal**: All React pages: Dashboard, Projects, Users, Patients, Today, Audit, Modules, etc.

**Tasks**: `ADMIN-061` to `ADMIN-095`

**Files to read first**:
- Session 8 commit history
- `/workspace/docs/architecture/05-FEATURES.md`
- `/workspace/docs/architecture/TAURI-PATTERNS.md`

---

## Session 10 — USER App (26 tasks)

**Goal**: Tauri user app, read-only projection, sync client, all UI pages.

**Tasks**: `USER-001` to `USER-026`

**Files to read first**:
- `/workspace/docs/architecture/00-OVERVIEW.md` (the "User = projection" section)
- Session 9's admin UI (mirror the structure)
- `/workspace/product/contracts/src/sync/`

---

## Session 11 — SYNC Protocol (9 tasks)

**Goal**: WebSocket server, frame validation, snapshot recovery, heartbeat, reconnection.

**Tasks**: `SYNC-001` to `SYNC-009`

**Files to read first**:
- `/workspace/docs/architecture/SYNC-PROTOCOL.md` (read ALL of it)

---

## Session 12 — Medical Module (9 tasks)

**Goal**: medical-reception module — patients, appointments, visits, prescriptions, SOAP notes.

**Tasks**: `MEDICAL-001` to `MEDICAL-009`

**Files to read first**:
- `/workspace/docs/modules/TUTORIAL.md`
- `/workspace/docs/modules/COOKBOOK.md`
- `/workspace/product/modules/sdk/README.md`
- `/workspace/product/contracts/src/events.ts` (event types)

---

## Session 13 — Food Lab Module (8 tasks)

**Goal**: food-lab module — samples, chain of custody, equipment, methods, lab reports.

**Tasks**: `FOODLAB-001` to `FOODLAB-008`

**Files to read first**:
- Same as Session 12

---

## Session 14 — More Modules + SDK (10 tasks)

**Goal**: invoice, hotel, restaurant, retail, gym, school, auto-billing skeleton modules + SDK docs.

**Tasks**: `MODULE-001` to `MODULE-007`, `SDK-001` to `SDK-003`

**Files to read first**:
- Session 12-13 modules (so you know the pattern)

---

## Session 15 — Security + Audit (13 tasks)

**Goal**: Rate limit, security headers, brute-force protection, key rotation, audit chain, GDPR export.

**Tasks**: `SECURITY-001` to `SECURITY-009`, `AUDIT-001` to `AUDIT-004`

**Files to read first**:
- `/workspace/docs/architecture/THREAT-MODEL.md`
- `/workspace/docs/compliance/HIPAA.md`
- `/workspace/docs/compliance/GDPR.md`

---

## Session 16 — Observability + Backup (9 tasks)

**Goal**: Prometheus metrics, OTel tracing, log shipper, Grafana dashboard, backup scheduler, restore.

**Tasks**: `OBSERVABILITY-001` to `OBSERVABILITY-004`, `BACKUP-001` to `BACKUP-005`

**Files to read first**:
- `/workspace/docs/architecture/METRICS.md`
- `/workspace/docs/runbooks/DR.md`

---

## Session 17 — Billing + Stripe (3 tasks)

**Goal**: Stripe live integration, checkout, webhooks, plan enforcement.

**Tasks**: `BILLING-001`, `BILLING-002`, `LAUNCH-002`

**Files to read first**:
- `/workspace/product/contracts/src/plans.ts`
- `/workspace/platform-cloud/src/billing/` (from Session 6)

---

## Session 18 — Onboarding + Email + Notifications (6 tasks)

**Goal**: Signup flow, email verification, SMTP templates, in-app notification center, web push.

**Tasks**: `ONBOARDING-001`, `ONBOARDING-002`, `EMAIL-001`, `EMAIL-002`, `NOTIFICATIONS-001`, `NOTIFICATIONS-002`

**Files to read first**:
- `/workspace/docs/launch/FIRST-CUSTOMER.md`

---

## Session 19 — UI polish: i18n + A11y + PDF + Search (9 tasks)

**Goal**: 8 languages, focus trap, axe-core, sick-leave cert PDF, lab report PDF, FTS5 search.

**Tasks**: `I18N-001` to `I18N-003`, `A11Y-001`, `A11Y-002`, `PDF-001`, `PDF-002`, `SEARCH-001`, `SEARCH-002`

**Files to read first**:
- `/workspace/docs/architecture/05-FEATURES.md` (i18n section)

---

## Session 20 — Infra: Performance + Scalability + Comm (8 tasks)

**Goal**: Benchmarks, scaling path, mDNS, mDNS-ACL, health checks, cluster heartbeat.

**Tasks**: `PERF-001`, `PERF-002`, `SCALABILITY-001`, `SCALABILITY-002`, `COMM-001` to `COMM-004`

**Files to read first**:
- `/workspace/docs/architecture/02-DECISIONS/SCALING-PATH.md`
- `/workspace/docs/architecture/TAILNET.md`

---

## Session 21 — Ops: Compliance + Marketplace + Support (8 tasks)

**Goal**: GDPR/HIPAA endpoints, module publisher flow, ops search CLI, support diagnostics.

**Tasks**: `COMPLIANCE-001` to `COMPLIANCE-003`, `MARKETPLACE-001` to `MARKETPLACE-003`, `SUPPORT-001`, `SUPPORT-002`

**Files to read first**:
- `/workspace/docs/compliance/SOC2-MATRIX.md`
- `/workspace/docs/marketplace/PUBLISHER.md`

---

## Session 22 — Cloud+Portal: Ops console, customer portal, regions, warehouse (9 tasks)

**Goal**: Cloud admin ops console, customer portal React app, country-based region routing, ClickHouse ETL.

**Tasks**: `CLOUD-ADMIN-001`, `CLOUD-ADMIN-002`, `PORTAL-001` to `PORTAL-003`, `MULTI-REGION-001`, `MULTI-REGION-002`, `WAREHOUSE-001`, `WAREHOUSE-002`

**Files to read first**:
- Session 6 (cloud backend)

---

## Session 23 — Polish: Migration + Events + Commands + Analytics + Arch (12 tasks)

**Goal**: v1→v2 plan, event registry, command catalog, KPI dashboard, fill architecture docs.

**Tasks**: `MIGRATION-001`, `MIGRATION-002`, `EVENTS-001` to `EVENTS-003`, `COMMANDS-001`, `COMMANDS-002`, `ANALYTICS-001`, `ANALYTICS-002`, `ARCH-001` to `ARCH-004` (top 4)

**Files to read first**:
- `/workspace/docs/architecture/INDEX.md`
- `/workspace/docs/architecture/CHECKLIST.md`

---

## Session 24 — Hardening: Chaos + Load + Release (15 tasks)

**Goal**: Chaos tests (kill-mid-write, partition, disk full, etc.), load tests, release process, rollback.

**Tasks**: `CHAOS-001` to `CHAOS-008`, `LOAD-001` to `LOAD-005`, `RELEASE-001`, `RELEASE-002`

**Files to read first**:
- `/workspace/docs/runbooks/DR.md`
- `/workspace/docs/runbooks/ROLLBACK.md`

---

## Session 25 — Launch: Pre-launch (20 tasks)

**Goal**: OpenAPI 3.1 spec, Stripe webhook hardening, GDPR tests, pen-test template, marketing site, legal templates, status page, onboarding wizard, module harness.

**Tasks**: `LAUNCH-001` to `LAUNCH-020`

**Files to read first**:
- `/workspace/docs/launch/DAY-1-TO-7.md`
- `/workspace/marketing/` (if exists)

---

## Session 26 — Launch: Operational + Final (21 tasks)

**Goal**: Module depth (retail/gym/school), exit interview, customer template, runbooks, day 1-7 plan, v1.0 tag.

**Tasks**: `LAUNCH-021` to `LAUNCH-041`

**Files to read first**:
- Session 25 commit history
- `/workspace/docs/launch/1000.md`

---

## After Session 26

- All 1002 tasks done
- All commits tagged v1.0.0
- Pen-test the production build (TASK 4-8 weeks)
- Fix any findings
- Soft launch with 5 beta customers
- Public launch

## Total time estimate

- 26 sessions × 25 min average = ~11 hours of AI work
- If you run 3 sessions in parallel: ~4 hours wall clock
- Plus human review and integration: 1-2 weeks of part-time work
- Plus pen-test and beta: 4-8 weeks
- **Total time to public launch: 6-10 weeks**
