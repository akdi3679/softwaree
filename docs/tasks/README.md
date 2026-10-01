# Task tree

Granular micro-tasks for the Product platform. Each file is one task = one PR = one change.

## Format

Every task file has:
- TASK ID, TITLE, STATUS, DEPENDENCIES
- ALLOWED FILES / FORBIDDEN FILES
- OBJECTIVE
- REQUIRED IMPLEMENTATION (exact code)
- TESTS (exact bash to run)
- EXPECTED OUTPUT

## See also

- [INDEX.md](INDEX.md) — overall status
- `architecture/` — locked ADRs and design docs (in /workspace/docs/architecture/)

## How tasks are organized

Tasks are grouped by **phase**:

- `repository/` — repo init, monorepo setup, tooling
- `contracts/` — shared TypeScript / Rust types
- `cloud/` — the Cloud control plane
- `admin/` — Admin Tauri app
- `user/` — User Tauri app
- `modules/` — module SDK, signing, sample modules
- `medical/`, `food-lab/` — domain-specific modules
- `events/`, `commands/`, `communication/` — cross-cutting
- `security/` — security hardening
- `audit/` — audit logs
- `observability/` — metrics, traces
- `backup/` — backup pipeline
- `disaster-recovery/` — DR runbooks, RPO/RTO
- `release/` — release pipeline, signing, rollback
- `sync/` — sync protocol between Admin and User
- `architecture/` — decisions, ADRs, principles
- `performance/` — perf budgets
