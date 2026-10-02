# Architecture Documentation Index

> **Status:** Active
> **Audience:** every engineer, every AI agent, every code review
> **Last regenerated:** after R15c in the wiring session

Every architecture document, its purpose, and when to read it.

---

## Core documents

| File | Purpose | Read when |
|---|---|---|
| 00-OVERVIEW.md | The platform in one document | First, always |
| 01-PRINCIPLES.md | 13 non-negotiable rules | Before any code review |
| 03-STACK.md | Tools, versions, why | Before adding a dependency |
| 04-GLOSSARY.md | Shared vocabulary | When a term is unfamiliar |
| 05-FEATURES.md | Feature catalog per module | When scoping a module |
| 06-MIGRATIONS.md | Schema migration rules | Before any schema change |
| 07-PERFORMANCE.md | Performance budgets | Before an optimization |
| SYNC-PROTOCOL.md | Admin <-> User sync wire format | Before touching sync code |
| STATUS-REPORT.md | Current implementation status | For a snapshot of reality |
| STARTUP.md | Boot sequence (Admin + Cloud) | When debugging startup |
| DATA-MODEL.md | Data ownership across systems | When unsure who owns a datum |
| 04-DEPLOYMENT.md | Deployment procedures | Before shipping |

---

## Architecture Decision Records (`02-DECISIONS/`)

| ADR | Title | Status |
|---|---|---|
| 001 | Three-repository model | Accepted |
| 002 | Admin as source of truth | Accepted |
| 003 | Tailscale / Headscale mesh identity | SUPERSEDED by 017-020 |
| 004 | Global sequence per project, per-user cursor | Accepted |
| 005 | One SQLite file per project | Accepted |
| 006 | Wasmtime as module runtime | Accepted |
| 007 | Triple-signed modules | Accepted |
| 008 | Snapshot-on-gap recovery | Accepted |
| 009 | No offline writes in v1 | Accepted |
| 010 | Roll our own auth | Accepted |
| 017 | Pure local networking | Accepted |
| 018 | Stable virtual IPs | Accepted |
| 019 | CGNAT detection | Accepted |
| 020 | Discovery service | Accepted |

Also in `02-DECISIONS/`:

| File | Purpose |
|---|---|
| BUILD-VS-BUY.md | Which components we build vs buy |
| DATA-FLOW.md | End-to-end data flow diagrams |
| SCALING-PATH.md | 5-stage scaling plan |

**Missing ADRs 011-016:** never written. If any of these are needed
in the future, they take those numbers.

---

## Cross-references

- Compliance docs: `../compliance/`
- Runbooks: `../runbooks/`
- Security: `../security/`
- Module authoring: `../modules/`
- Migration guides: `../migration/`

---

## Rules for changing this doc set

1. Every change to architecture requires a new ADR.
2. The ADR is written before the code, not after.
3. A PR that violates 01-PRINCIPLES.md must reference an ADR that
   authorizes the violation.
4. If the code disagrees with a locked doc, the doc wins until an ADR
   supersedes it.