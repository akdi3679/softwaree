# CLOUD — Private Cloud Platform

Micro-tasks for `platform-cloud/`. The private cloud platform that handles auth, project registry, device registry, module signing, and encrypted backup storage. Never holds business data.

## Groups

| Group | Topic | Tasks |
|---|---|---|
| CLOUD-001 | Cloud repo init | CLOUD-001.1 → 001.6 (6 tasks) |
| CLOUD-002 | Hono API skeleton | CLOUD-002.1 → 002.8 (8 tasks) |
| CLOUD-003 | Drizzle / Postgres setup | CLOUD-003.1 → 003.6 (6 tasks) |
| CLOUD-004 | Core schema (accounts, sessions) | CLOUD-004.1 → 004.6 (6 tasks) |
| CLOUD-005 | Identity domain schema (devices) | CLOUD-005.1 → 005.5 (5 tasks) |
| CLOUD-006 | Project domain schema | CLOUD-006.1 → 006.5 (5 tasks) |
| CLOUD-007 | Module registry schema | CLOUD-007.1 → 007.5 (5 tasks) |
| CLOUD-008 | Plan schema + seed | CLOUD-008.1 → 008.5 (5 tasks) |
| CLOUD-009 | Audit schema | CLOUD-009.1 → 009.4 (4 tasks) |
| CLOUD-010 | Auth service (handlers) | CLOUD-010.1 → 010.8 (8 tasks) |
| CLOUD-011 | Auth crypto (password, device key) | CLOUD-011.1 → 011.6 (6 tasks) |
| CLOUD-012 | Session service | CLOUD-012.1 → 012.5 (5 tasks) |
| CLOUD-013 | Device service (register, replace) | CLOUD-013.1 → 013.6 (6 tasks) |
| CLOUD-014 | Project service | CLOUD-014.1 → 014.5 (5 tasks) |
| CLOUD-015 | Membership service | CLOUD-015.1 → 015.4 (4 tasks) |
| CLOUD-016 | Invitation service | CLOUD-016.1 → 016.5 (5 tasks) |
| CLOUD-017 | Module registry service | CLOUD-017.1 → 017.5 (5 tasks) |
| CLOUD-018 | Module signing service | CLOUD-018.1 → 018.6 (6 tasks) |
| CLOUD-019 | Audit service | CLOUD-019.1 → 019.4 (4 tasks) |
| CLOUD-020 | API routes | CLOUD-020.1 → 020.8 (8 tasks) |
| CLOUD-021 | Health, metrics, observability | CLOUD-021.1 → 021.4 (4 tasks) |
| CLOUD-022 | Backup endpoints (for Admin) | CLOUD-022.1 → 022.4 (4 tasks) |
| CLOUD-023 | Docker + deployment | CLOUD-023.1 → 023.4 (4 tasks) |
| CLOUD-024 | CI for cloud | CLOUD-024.1 → 024.3 (3 tasks) |

## Total: 124 micro-tasks

## Order of execution

REPO → CONTRACT (done) → CLOUD (now) → ADMIN → USER → SYNC → MODULE → MEDICAL → FOOD-LAB.

## Architecture references

Every CLOUD task references the relevant ADR. Key ones:
- ADR-001: three-repository model
- ADR-002: Admin as source of truth
- ADR-004: global event sequence (Cloud uses per-event sequence, not per-aggregate)
- ADR-007: triple-signed modules
- ADR-010: roll-our-own auth

## Security rules (do not break)

1. **No business tables in the Cloud.** Only platform tables.
2. **Backups are encrypted client-side.** The Cloud cannot decrypt.
3. **Signing key is in a separate process.** The auth service cannot sign.
4. **All routes are versioned under `/v1/`.**
5. **No health endpoint reveals internals.**
6. **All auth events are audited.**
