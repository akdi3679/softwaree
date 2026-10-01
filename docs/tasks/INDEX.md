# Product Platform — Task Index

Last updated: 2026-08-04
**Total: 416 micro-tasks · ~35,000 lines of spec · 24 directories · 13 architecture docs**

This is the master index. Each task is one PR = one change. Format guarantees "even a stupid AI can do it" granularity.

---

## Phase status (24 directories)

| Phase | Status | Tasks | Phase dir |
|-------|--------|-------|-----------|
| repository (REPO) | ✅ COMPLETE | 45 | `tasks/repository/` |
| contracts (CONTRACT) | ✅ COMPLETE | 88 | `tasks/contracts/` |
| cloud (CLOUD) | ✅ COMPLETE | 70 | `tasks/cloud/` |
| admin (ADMIN) | ✅ COMPLETE | 80 | `tasks/admin/` |
| medical (MEDICAL) | ✅ SOLID | 13 | `tasks/medical/` |
| food-lab (FOODLAB) | ✅ SOLID | 6 | `tasks/food-lab/` |
| modules (MODULE) | ✅ STARTED | 10 | `tasks/modules/` |
| user (USER) | 🟡 IN PROGRESS | 30 | `tasks/user/` |
| security (SECURITY) | 🟡 IN PROGRESS | 10 | `tasks/security/` |
| audit (AUDIT) | 🟡 IN PROGRESS | 3 | `tasks/audit/` |
| observability (OBS) | 🟡 IN PROGRESS | 7 | `tasks/observability/` |
| backup (BACKUP) | 🟡 IN PROGRESS | 4 | `tasks/backup/` |
| disaster-recovery (DR) | 🟡 IN PROGRESS | 4 | `tasks/disaster-recovery/` |
| release (RELEASE) | 🟡 IN PROGRESS | 5 | `tasks/release/` |
| sync (SYNC) | 🟡 IN PROGRESS | 5 | `tasks/sync/` |
| events (EVENTS) | 🟡 IN PROGRESS | 3 | `tasks/events/` |
| commands (COMMANDS) | 🟡 IN PROGRESS | 2 | `tasks/commands/` |
| communication (COMM) | 🟡 IN PROGRESS | 4 | `tasks/communication/` |
| performance (PERF) | 🟡 IN PROGRESS | 4 | `tasks/performance/` |
| architecture (ARCH) | 🟡 IN PROGRESS | 8 | `tasks/architecture/` |
| scalability (SCALE) | 🟡 IN PROGRESS | 3 | `tasks/scalability/` |
| compliance (COMPLY) | 🟡 IN PROGRESS | 4 | `tasks/compliance/` |
| marketplace (MARKET) | 🟡 IN PROGRESS | 4 | `tasks/marketplace/` |
| support (SUPPORT) | 🟡 IN PROGRESS | 4 | `tasks/support/` |

**Sample modules (medical-reception, food-lab)**: 19 tasks total covering patient lifecycle, appointments, visits, SOAP notes, samples, tests, results, reports, plus idempotency, concurrency tests, error paths, and Admin UI pages for patients, today, active visit, sample queue, intake.

---

## Architecture (locked, 13 docs)

| Doc | What |
|-----|------|
| `docs/architecture/00-OVERVIEW.md` | 3 repos · 4 systems · authority model |
| `docs/architecture/01-PRINCIPLES.md` | 12 non-negotiable rules |
| `docs/architecture/02-DECISIONS/ADR-001..010` | 10 ADRs (three-repo, Admin=truth, our WireGuard mesh, global sequence + cursor, snapshot-on-gap, SQLite-per-project, Wasmtime, triple-sig, no offline writes v1, roll-our-own auth) |
| `docs/architecture/02-DECISIONS/DATA-FLOW.md` | End-to-end Mermaid sequence + failure modes |
| `docs/architecture/02-DECISIONS/BUILD-VS-BUY.md` | Every tech choice with rejected alternatives |
| `docs/architecture/02-DECISIONS/SCALING-PATH.md` | Stages 0→4 (1 → 1M users) |
| `docs/architecture/03-STACK.md` | Full tool table |
| `docs/architecture/04-DEPLOYMENT.md` | VMs, Helm, topology |
| `docs/architecture/05-FEATURES.md` | Feature flag system |
| `docs/architecture/06-MIGRATIONS.md` | Schema + data + code migrations |
| `docs/architecture/07-PERFORMANCE.md` | Hot paths + optimization strategy |
| `docs/architecture/SYNC-PROTOCOL.md` | Admin↔User protocol v1 spec |
| `docs/architecture/TAILNET.md` | Two-tailnet architecture + ACLs |
| `docs/security/THREAT-MODEL.md` | T1-T8 threats + mitigations |
| `docs/compliance/HIPAA.md` | HIPAA §164.312 mapping |
| `docs/compliance/GDPR.md` | Article-by-Article mapping |
| `docs/performance/BUDGETS.md` | p50/p95/p99 for every layer |
| `docs/runbooks/DR.md` | Disaster recovery scenarios |
| `docs/runbooks/SUPPORT.md` | Common failures + debugging |
| `docs/release/SIGNING.md` | Tauri signing key procedure |
| `docs/release/ROLLBACK.md` | Rollback procedure |
| `docs/marketplace/PUBLISHER.md` | How to publish a module |
| `docs/marketplace/CUSTOMER.md` | How customers install modules |

---

## How to use this tree

Each task is a `.md` file in `tasks/<phase>/<TASK-ID>.md`. To execute a task:

1. Read the file in full
2. Implement exactly what `REQUIRED IMPLEMENTATION` says (paths, code, content — all specified)
3. Run the `TESTS` script (exact bash given)
4. If it passes, commit with the message format shown
5. Move to the next task in the dependency chain

**Granularity guarantee**: every task has exact file paths, exact code, exact commands, exact expected output. A "stupid AI" that follows instructions literally will produce working code.

---

## How we scale (the path)

`docs/architecture/02-DECISIONS/SCALING-PATH.md` defines:

- **Stage 0** (< 100 users): single Cloud VM, single Postgres, single MinIO — what we have today
- **Stage 1** (100-1K): read replica + monitoring
- **Stage 2** (1K-10K): multi-AZ Postgres, Cloud autoscaling, MinIO erasure coding, Cloudflare
- **Stage 3** (10K-100K): multi-region, Postgres sharding by project_id, Redis cache, NATS
- **Stage 4** (100K-1M): per-region primaries, edge functions, separate billing service

**What does NOT change**: one Admin per project, User is read-only, modules triple-signed, our WireGuard mesh, roll-our-own auth. The architecture scales linearly; we never re-architect.

---

## What I'd still add (next)

If you want me to keep going, the natural next slices are:

1. **More sample modules** (retail, gym, school) — ~30 tasks each, full domain coverage like medical
2. **More medical/food-lab depth** — billing, reports, exports, recurring appointments
3. **More sync edge cases** — reconnection storms, partial sync, concurrent device
4. **More module security** — fuzzing, supply chain, third-party audit
5. **i18n + a11y** — multi-language, screen reader, RTL
6. **More tests** — chaos, load, conformance — to push toward "no mistakes"
7. **Billing integration** — Stripe, plan enforcement, invoices
8. **Customer support tooling** — admin impersonation, log search UI, account takeover flow

Just say "continue" or be specific.

---

## Quick commands

```bash
# List all tasks
find /workspace/tasks -name "*.md" -not -name "README*" -not -name "INDEX.md" | sort

# Count
find /workspace/tasks -name "*.md" -not -name "README*" -not -name "INDEX.md" | wc -l

# Get one task
cat /workspace/tasks/admin/ADMIN-001.1.md

# Find tasks by phase
ls /workspace/tasks/medical/

# Find tasks by dependency
grep -l "DEPENDENCIES: ADMIN-005.10" /workspace/tasks/admin/*.md
```

---

## Files in this bundle

- `tasks/` — 416 micro-task specs
- `docs/` — 13 architecture + 4 compliance/security/release/performance/marketplace/runbook docs
- `INDEX.md` (this file) — the master index
- `README.md` — quick navigation

Total: 280KB compressed.
