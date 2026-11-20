# Product v1.0 — AI Session Plan (SUPERSEDED)

> **Status: SUPERSEDED — 2026-11-20**
> **Superseded by:** `v1/04-PHASES.md` (honest estimate: **7–9.5 weeks**)
> **Kept for historical context only. Do not execute from this file.**

---

## Why this plan was superseded

1. **The estimate was not credible.** "26 sessions × 25 min ≈ 11 hours of AI work" for a platform with a custom auth service, a userspace mesh, a module sandbox, a signing hierarchy, typed patching and a recovery ceremony is off by orders of magnitude. `v1/04-PHASES.md` carries the real estimate.
2. **It referenced documents that do not exist.** `ADR-005-modules.md`, `TAILNET.md`, `THREAT-MODEL.md` (at the time), `04-DEPLOYMENT.md`, `05-FEATURES.md`, `06-MIGRATIONS.md`, `TAURI-PATTERNS.md`, `SCALING-PATH.md`, `INDEX.md`, `CHECKLIST.md`, and several compliance and runbook files.
3. **It contradicted v1 scope.** Session 14 and Session 26 list hotel, gym, school, retail, restaurant and invoice modules. **v1 ships exactly two modules:** `medical-reception` and `food-lab`.
4. **It predates the architecture corrections.** It assumes the Tailscale tailnet, the five-message write handshake, Drizzle in Rust, kernel WireGuard, and 13 principles. All of those have been superseded by ADR-004/005/006/011/012/015/017/018/019/020/024 and the 14-principle set.

---

## Corrected context reading list

Every session must read these, in this order. All of them exist.

```
1. docs/architecture/00-OVERVIEW.md
2. docs/architecture/01-PRINCIPLES.md            (14 principles)
3. docs/architecture/02-DECISIONS/               (ADR-001 … ADR-024)
4. docs/architecture/SYNC-PROTOCOL.md
5. docs/architecture/03-STACK.md                 (pins verified at Phase 0)
6. docs/architecture/THREAT-MODEL.md
7. docs/architecture/FAILURE-MATRIX.md
8. docs/architecture/04-GLOSSARY.md
9. product/AGENTS.md
10. v1/04-PHASES.md                              (the real plan and estimate)
```

Key ADRs by work area:

| Work area | Required ADRs |
|---|---|
| Repo / CI | 001 |
| Admin core, events, commands | 002, 004, 005, 012 |
| Storage, keys, backup, restore | 005, 016, 022 |
| Modules and module UI | 006, 007, 011 |
| Sync engine | 004, 008, 009, 012 + SYNC-PROTOCOL |
| Auth, certificates, invitations | 010, 012 |
| Networking | 017, 018, 019, 020, 024 |
| Plans, billing, entitlements | 014, 021 |
| Owner Console, publishing, approvals | 013 |
| Live heart / patching | 015 |
| First run / offline | 023 |

---

## Universal session prompt (still valid)

```
You are a senior engineer implementing the Product platform spec.

Context files (read first, in this order):
1. docs/architecture/00-OVERVIEW.md
2. docs/architecture/01-PRINCIPLES.md
3. docs/architecture/02-DECISIONS/ (all ADRs 001–024)
4. docs/architecture/SYNC-PROTOCOL.md
5. docs/architecture/THREAT-MODEL.md and FAILURE-MATRIX.md
6. product/AGENTS.md
7. v1/04-PHASES.md and the task index

Rules:
- The doc set wins over the code. Breaking a principle requires an ADR.
- Never invent a table, frame, key, endpoint or error name. They are all
  enumerated in ADR-012, ADR-022, SYNC-PROTOCOL and 00-OVERVIEW §2.3.
- Every task ends with its test command passing.

For each task ID listed:
1. Read the task file
2. Create the file(s) exactly as specified
3. Run the test command
4. If it passes, commit with the given message
5. If it fails, fix the implementation — never the test

TASKS FOR THIS SESSION:
<paste task IDs>

Finish with a status report: done, failed and why, what to look at next.
```

---

## Disposition of the original 26 sessions

| # | Original goal | Disposition |
|---|---|---|
| 1 | Repo foundation | **Keep** |
| 2 | Repo tooling | **Keep** — reading list corrected |
| 3 | Contracts core | **Keep** — add certificate, patch-op, plan-record and permission types |
| 4 | Contracts sync | **Keep** — 11 frame types, one-round-trip write path |
| 5 | Contracts SDK | **Keep** |
| 6 | Cloud backend | **Keep** — add certificates, module-access sync, discovery, relay, recovery initiation |
| 7 | Admin foundation | **Keep** — SQLCipher, keyring, `rusqlite_migration`, userspace tunnel |
| 8 | Admin domain | **Keep** — event-first + single `apply_event`, read audit, erasure ledger |
| 9 | Admin UI | **Keep** |
| 10 | User app | **Keep** — no command queue |
| 11 | Sync protocol | **Keep** — rewritten protocol |
| 12 | medical-reception | **Keep** |
| 13 | food-lab | **Keep** |
| 14 | Extra modules + SDK | **Cut.** v1 ships two modules. SDK docs move to 12/13. |
| 15 | Security + audit | **Keep** — THREAT-MODEL.md now exists |
| 16 | Observability + backup | **Keep** — custody modes, `sqlcipher_export`, ledger re-apply |
| 17 | Billing + Stripe | **Keep** — plans-as-data, dunning, read-only allow-list |
| 18 | Onboarding + email | **Keep** — opaque invitations, mandatory 2FA, recovery alerts |
| 19 | i18n / a11y / PDF / search | **Keep** — blind indexes for sensitive search |
| 20 | Performance + comms | **Keep** — `TAILNET.md` replaced by ADR-017…020, 024 |
| 21 | Compliance + publisher + support | **Keep** — publisher flow is ADR-013, two-person |
| 22 | Ops console / portal / regions / warehouse | **Split.** Owner Console is in scope (ADR-013). ClickHouse warehouse and multi-region are **post-v1**. |
| 23 | Migration / events / analytics / arch | **Keep** — architecture docs are now complete |
| 24 | Chaos + load + release | **Keep** — add patch kill-switch and relay-failure chaos |
| 25 | Pre-launch | **Keep** |
| 26 | Operational + final | **Keep** — extra-module tasks removed |

**New work not present in the original plan:** ADR-011 module UI sandbox and bridge; ADR-012 grant/revoke lifecycle and certificates; ADR-013 Owner Console; ADR-014 clock anchor and entitlements; ADR-015 typed patch compiler, rings, kill-switch; ADR-016 crypto-shredding, blind indexes, read audit; ADR-022 key hierarchy and recovery ceremony; ADR-023 offline activation; ADR-024 userspace tunnel, hole-punch, blind relay, probe.

---

## Estimate

**Superseded.** See `v1/04-PHASES.md`: **7–9.5 weeks** of engineering, plus external security audit and beta. The "~11 hours" figure is retained above only as a record of what was wrong.