# ADR-021: Plan Tiers

**Status:** Accepted
**Date:** 2026-11-20
**Deciders:** Architecture team
**See also:** ADR-014 (licensing + entitlements — the enforcement mechanism), ADR-013 (plan CRUD), ADR-016 (quotas + retention), ADR-005 (storage), ADR-023 (bootstrap)

> This ADR is the architecture-level definition of the tiers. ADR-014 defines **how** entitlements are enforced. Where any task list, phase doc or older prose disagrees with these two ADRs, the ADRs win until superseded.

---

## Context

The overview described four plans as a prose table. Two problems followed:

1. Adding or changing a plan required a code change, which contradicts the owner's goal of creating plans and projects themselves.
2. The numbers drifted between documents (manual backup totals, audit retention, "unlimited" users), because prose is not a schema.

## Decision

**Plans are rows in the Cloud database, not branches in code.** This ADR fixes the v1 seed data and the meaning of each limit. ADR-014 fixes the enforcement rule: *a capability exists only if the Cloud will sign something that grants it.*

### The plan record

```
plans {
  id, name, version, state: active | retired,
  limits: {
    admin_devices, projects,
    users_licensed, users_tested_ceiling,
    cloud_backup: none | daily | daily_plus_manual,
    backup_window_local,
    backup_quota_bytes,
    manual_backup_count_per_month,
    manual_backup_max_bytes, manual_backup_total_bytes,
    corbeille_quota_bytes,
    audit_snapshot_retention_days
  },
  module_entitlements: [ "standard-set" | module_id | "custom" ],
  price: { currency, amount, interval }
}
```

### v1 seed data

| Limit | Plan 1 — Local | Plan 2 — Starter | Plan 3 — Team | Plan 4 — Enterprise |
|---|---|---|---|---|
| Admin devices | 1 | 1 | 1 | 1 |
| Projects | 1 | 1 | 1 | multiple |
| Users (licensed) | 0 | 3 | 10 | unlimited |
| Users (tested ceiling) | 0 | 3 | 10 | **200 concurrent per Admin** |
| Cloud backup | none | daily | daily | daily + manual |
| Backup window (Admin picks) | — | 00:00–06:00 local | 00:00–06:00 local | 00:00–06:00 local |
| Backup quota | — | 50 GB | 500 GB | 5 TB |
| Daily / manual split | — | 50 GB daily | 500 GB daily | **4.9 TB daily + 100 GB manual** |
| Manual backups | — | — | — | 10 / month, ≤10 GB each, ≤100 GB total |
| Corbeille quota | local only | 5 GB | 50 GB | 500 GB |
| Audit snapshot retention | local only | 1 year | 5 years | forever |
| Module entitlements | standard-set | standard-set | standard-set | standard-set + custom |
| Licence shape | **perpetual local** | 30-day, renewable | 30-day, renewable | 30-day, renewable |

`standard-set` = the two v1 modules, `medical-reception` and `food-lab`. No plan entitles a customer to publish modules; publishing is always ours, via the private channel (ADR-013).

---

## What each limit actually means

| Limit | Measured on | Enforcement point |
|---|---|---|
| `admin_devices` | Cloud device registry, state ACTIVE | Cloud refuses to activate a second Admin (Principle 2) |
| `projects` | Cloud project registry | Cloud refuses to sign a licence for an over-limit project |
| `users_licensed` | Cloud membership records | Cloud refuses to issue membership certificates past the limit |
| `users_tested_ceiling` | **not a licence limit** — an engineering statement | Load-test evidence required to raise it; never a marketing number |
| `backup_quota_bytes` | Cloud object storage per project | Cloud refuses the upload; the Admin is warned first. **Local backup is never blocked.** |
| `manual_backup_*` | Cloud, per calendar month | Cloud refuses to sign a manual-backup slot |
| `corbeille_quota_bytes` | **serialized byte size of the Admin's local `tombstones` table** | Admin, locally (ADR-016). Cloud holds metadata only. |
| `audit_snapshot_retention_days` | **Cloud-held audit snapshot availability** | Cloud lifecycle policy. **The Admin's local hash chain is never deleted** (Principle 11). |
| `module_entitlements` | Cloud module registry | Cloud refuses to sign a bundle (ADR-007) |

Two rows in that table are the ones that used to contradict other documents, and they are now unambiguous: **corbeille quota is local tombstone bytes**, and **audit retention is Cloud snapshot availability, not deletion of the chain.**

---

## Tier semantics

**Plan 1 — Local.** One Admin, one project, zero Users, no Cloud backup, no discovery obligation. Holds a **perpetual local licence** (`license_expiry = null`), so it never expires and never needs the Cloud after activation (ADR-014, ADR-023). It is a real product, not a crippled trial: the standard modules run fully, local backup and export always work. It is the tier for a single-machine office or an air-gapped site.

**Plan 2 — Starter.** One Admin plus up to 3 Users. Daily encrypted Cloud backup inside the Admin-chosen window. One year of Cloud audit snapshots.

**Plan 3 — Team.** One Admin plus up to 10 Users. Larger backup and corbeille quotas, five years of Cloud audit snapshots. This is also the **trial** feature set (14 days, ADR-014).

**Plan 4 — Enterprise.** Multiple projects on one Admin, unlimited licensed Users with a stated engineering ceiling, manual backups with a passphrase option (never escrowed, ADR-022), custom modules signed per project, unlimited Cloud audit snapshot retention.

---

## Changing plans

- **Upgrade:** the Cloud re-signs the licence, re-issues module bundles where entitlements grew, and re-issues membership certificates where the user limit grew. Nothing is deleted.
- **Downgrade:** over-limit Users become read-only members chosen by the Admin; over-limit projects become read-only and exportable; a no-longer-entitled custom module is disabled but its tables are retained and exportable. **No deletion, ever** (ADR-014, Principle 14).
- **Retiring a plan** in the Console never changes an existing customer's entitlements until their renewal.
- **Editing a plan** is a two-person, audited owner action (ADR-013). Plans are versioned; a customer's licence names the plan version it was signed under.

---

## Consequences

### Positive
- The owner adds a plan without a release.
- Every number in the table has a unit and an enforcement point, so docs and code can be reconciled.
- "Unlimited" is honest: unlimited **licensed**, with a tested ceiling stated separately.
- Plan 1 works forever offline, which makes the local-first claim true rather than conditional.

### Negative
- Plan changes require re-signing licences, bundles and certificates. Accepted — infrequent.
- Two user numbers (licensed vs tested) must be explained in sales material, or the ceiling will be mistaken for a limit.

### Neutral
- The seed table above is data. Changing it is a Console action plus an ADR note, not a refactor.
- Per-project overrides are possible in Plan 4 by signing a licence with custom limits; the plan row is the default, not a cage.

---

## Alternatives Considered

**Hardcoded tiers in the client.** Rejected: the owner cannot add plans, and a patched client bypasses the check.

**Per-seat pricing only.** Rejected: our cost driver is backup storage and support, not seats; the tiers reflect that.

**"Unlimited users" with no ceiling stated.** Rejected: one laptop cannot serve an unbounded number of concurrent sync clients. State the tested number.

**Audit retention meaning "delete the chain after N years".** Rejected: it destroys the tamper-evidence regulated customers are buying (ADR-016).

**Plan 1 requiring periodic Cloud contact.** Rejected: it would make the air-gapped tier unusable and contradict Principle 14.

---

## Enforcement

- The plan seed lives in a Cloud migration; the Console is the only writer, with two-person approval.
- Lint: no client code branches on a plan id or name for a capability decision (ADR-014).
- Every limit in the table has exactly one enforcement implementation, named in the table above.
- CI test: the numbers rendered in the UI come from the plan record, not from a constant in the app.

### Tests
- [ ] New plan created in the Console → assignable with no code change
- [ ] Plan 1 offline for 90 days → fully operational
- [ ] Plan 2 with 4 active Users → Cloud refuses the 4th membership certificate
- [ ] Plan 4 manual backup #11 in a month → refused; local backup still works
- [ ] Plan 4 daily quota reached → upload refused with warning; local backup unaffected
- [ ] Downgrade Plan 4 → Plan 3 with 12 Users → 10 active, 2 read-only, zero deletions
- [ ] Corbeille quota figure in the UI equals serialized tombstone bytes
- [ ] Cloud audit snapshot expires at the plan window; local chain intact