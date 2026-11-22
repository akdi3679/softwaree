# ADR-021: Plan Tiers

**Status:** Accepted — amended 2026-11-22 (review pass 4)
**Date:** 2026-11-20
**Amended:** 2026-11-22 — added `backup_retention_days` to plan record and seed table; wrapped plan record in code fence; restored `- [ ]` test checkboxes; updated 14-day grace test to 44 days.
**Deciders:** Architecture team
**See also:** ADR-014 (licensing), ADR-013 (approvals), ADR-016 (quotas), ADR-005 (storage)

---

## Context

Plans must be rows in the Cloud database, not branches in code. This ADR fixes the v1 seed data and the meaning of each limit.

## Decision

**Plans are rows in the Cloud database.** Entitlements are enforced by **what the Cloud will sign** (ADR-014).

### The plan record

```
plans {
  id, name, version, state: active | retired,
  offered_in_milestone: [ milestone_id ],
  limits: {
    admin_devices, projects,
    users_licensed, users_tested_ceiling,
    cloud_backup: none | daily | daily_plus_manual,
    backup_window_local,
    backup_quota_bytes,
    manual_backup_count_per_month,
    manual_backup_max_bytes, manual_backup_total_bytes,
    corbeille_quota_bytes,
    audit_snapshot_retention_days,
    backup_retention_days
  },
  module_entitlements: [ "standard-set" | module_id | "custom" ],
  price: { currency, amount, interval },
  licence_shape: perpetual | renewable_30d
}
```

`offered_in_milestone` is how "Plan 1 exists but is not sold in v1-foodlab" is expressed as data. Enabling it later is a Console action, not a release. `state: retired` never changes an existing customer's entitlements until renewal.

`standard-set` = the two architecture-v1 modules, `medical-reception` and `food-lab`. No plan entitles a customer to publish modules; publishing is always ours, via the private channel (ADR-013).

### v1 seed data (5 plans)

| Limit | Plan 1 (Local) | **Plan 1+ (Solo Cloud)** | Plan 2 (Starter) | Plan 3 (Team) | Plan 4 (Enterprise) |
|---|---|---|---|---|---|
| Admin devices | 1 | 1 | 1 | 1 | 1 |
| Projects | 1 | 1 | 1 | 1 | multiple |
| Users (licensed) | 0 | **0** | 3 | 10 | unlimited |
| Users (tested ceiling) | 0 | 0 | 3 | 10 | 200 concurrent |
| Cloud backup | none | **daily** | daily | daily | daily + manual |
| Backup quota | — | **10 GB** | 50 GB | 500 GB | 5 TB |
| Corbeille quota | local only | **5 GB** | 5 GB | 50 GB | 500 GB |
| Audit snapshot retention | local only | **1 year** | 1 year | 5 years | forever |
| Backup retention (days) | — | 30 | 30 | 30 | 30 |
| Backup window (Admin picks) | — | 00:00–06:00 local | 00:00–06:00 local | 00:00–06:00 local | 00:00–06:00 local |
| Daily / manual split | — | 10 GB daily | 50 GB daily | 500 GB daily | 4.9 TB daily + 100 GB manual |
| Manual backups | — | — | — | — | 10/month, ≤10 GB each, ≤100 GB total |
| Module entitlements | standard-set | standard-set | standard-set | standard-set | standard-set + custom |
| Custom modules | ✗ | ✗ | ✗ | ✗ | ✓ |
| Licence shape | perpetual | 30-day renewable | 30-day renewable | 30-day renewable | 30-day renewable |
| Price | one-time paid (when offered) | 149 TND / month | TBD | TBD | TBD |
| Offered in v1-foodlab | ✗ | ✓ | ✗ | ✗ | ✗ |

### v1-foodlab scope restriction

**Plan 1 (Local) is NOT offered in the v1-foodlab milestone.**
The v1 acceptance tests (specifically Test #8: "laptop died" recovery) depend entirely on cloud backup and escrow. Offering a plan with no backup undermines the core product promise and creates catastrophic data-loss risk for food labs. v1-foodlab launches with **Plan 1+ (Solo Cloud) only**. Plan 1 may be introduced in later milestones as a one-time paid tier with explicit "no backup" warnings.

---

## What each limit actually means

| Limit | Measured on | Enforcement point |
|---|---|---|
| `admin_devices` | Cloud device registry | Cloud refuses to activate a second Admin |
| `projects` | Cloud project registry | Cloud refuses to sign a licence for over-limit |
| `users_licensed` | Cloud membership records | Cloud refuses to issue membership certificates |
| `backup_quota_bytes` | Cloud object storage | Cloud refuses upload; Admin warned. Local backup never blocked. |
| `corbeille_quota_bytes` | **Serialized byte size of Admin's local `tombstones`** | Admin, locally (ADR-016). |
| `audit_snapshot_retention` | Cloud-held audit snapshot availability | Cloud lifecycle policy. Admin's local chain never deleted. |
| `backup_retention_days` | Cloud object storage lifecycle | Cloud deletes old archives after this window. Default 30. |
| `users_tested_ceiling` | not a licence limit — an engineering statement | Load-test evidence required to raise it; never a marketing number |
| `manual_backup_*` | Cloud, per calendar month | Cloud refuses to sign a manual-backup slot |
| `module_entitlements` | Cloud module registry | Cloud refuses to sign a bundle (ADR-007) |

### Changing plans

- **Upgrade:** the Cloud re-signs the licence, re-issues bindings where entitlements grew, and re-issues membership certificates where the user limit grew. Module sections are untouched (ADR-007). Nothing is deleted.
- **Downgrade:** over-limit Users become read-only members chosen by the Admin; over-limit projects become read-only and exportable; a no-longer-entitled custom module is disabled but its tables are retained and exportable. No deletion, ever (ADR-014 §2.3, Principle 14).
- **Retiring a plan** never changes an existing customer's entitlements until renewal.
- **Editing a plan** is a quorum-approved, audited owner action (ADR-013). Plans are versioned; a licence names the plan version it was signed under.

---

## Consequences

### Positive
- The owner adds a plan without a release.
- "Unlimited" is honest: unlimited *licensed*, with a tested ceiling stated separately.
- Plan 1+ provides the necessary backup infrastructure for v1 acceptance tests to pass.

### Negative
- Five plans instead of four. Accepted.

---

## Enforcement

- Lint: no client code branches on a plan id or plan name for a capability decision.
- Lint: no project-operation handler reads a Cloud session token.
- Lint: `license_state` and the clock anchor are never written to `project.db`.
- The licence verification function is the only reader of `license_state`; the anchor update function is the only writer.
- Quotas and limits are read from the verified licence payload. Lint: no quota constant is read from a local settings table.
- The read-only allow-list is enforced at the command-handler boundary.
- Every export path is reachable in every billing state — CI asserts export works in `active`, `grace`, `read_only`, `restricted`, `bootstrap`, `perpetual`.
- Webhook handlers are idempotent and signature-verified.
- Plan edits require quorum approval and are audited (ADR-013).

### Tests

- [ ] New plan created in Console → assignable with no code change
- [ ] Plan 1+ offline for 44 days (30 TTL + 14 grace) → still full operation; day 45 → read-only, export still works
- [ ] Plan 1+ with 1 User → Cloud refuses the membership certificate
- [ ] Corbeille quota figure in UI equals serialized tombstone bytes
- [ ] Plan 1 not selectable in v1-foodlab; enabling `offered_in_milestone` makes it selectable with no code change
- [ ] Plan 4 manual backup #11 in a month → refused; local backup still works
- [ ] Downgrade Plan 4 → Plan 3 with 12 Users → 10 active, 2 read-only, zero deletions
- [ ] Cloud audit snapshot expires at the plan window; local chain intact