# ADR-014: Licensing, Billing, and Entitlements

**Status:** Accepted
**Date:** 2026-11-20
**Deciders:** Architecture team
**See also:** ADR-007 (bindings + expiry), ADR-010 (certificates), ADR-012 (module access), ADR-013 (plan CRUD), ADR-021 (plan tiers), ADR-022 (recovery), ADR-023 (bootstrap), Principle 14

---

## Context

The overview said the Cloud "knows billing and plans", but nothing defined trial, licence lifetime, grace, read-only behaviour, downgrade behaviour, or clock tampering. The plan table existed only as prose, so adding a plan meant a code change — which contradicts the owner's goal of creating plans and projects themselves.

## Decision

### 1. Plans are data

A plan is a row in the Cloud database, not a branch in client code:

```
plans {
  id, name, version,
  limits: {
    admin_devices, projects, users_licensed, users_tested_ceiling,
    backup_quota_bytes, backup_cadence, manual_backup_count,
    manual_backup_max_bytes, manual_backup_total_bytes,
    corbeille_quota_bytes, audit_snapshot_retention_days
  },
  module_entitlements: [ module_id | "standard-set" | "custom" ],
  price: { currency, amount, interval },
  state: active | retired
}
```

The owner creates and edits plans through the Owner Console with two-person approval (ADR-013). Retiring a plan never changes existing customers' entitlements until renewal.

**v1 seed data** (this is the prose table from the overview, expressed as data):

| | Plan 1 Local | Plan 2 Starter | Plan 3 Team | Plan 4 Enterprise |
|---|---|---|---|---|
| Admin devices | 1 | 1 | 1 | 1 |
| Projects | 1 | 1 | 1 | multiple |
| Users | 0 | 3 | 10 | unlimited licensed (tested ceiling 200 concurrent per Admin) |
| Cloud backup | ✗ | daily | daily | daily + manual |
| Backup quota | — | 50 GB | 500 GB | 5 TB (4.9 TB daily + 100 GB manual) |
| Manual backups | — | — | — | 10/month, ≤10 GB each, ≤100 GB total |
| Corbeille quota | local only | 5 GB | 50 GB | 500 GB |
| Audit snapshot retention | local only | 1 year | 5 years | forever |
| Custom modules | ✗ | ✗ | ✗ | ✓ |

### 2. Entitlements are what the Cloud will sign

**One rule, no exceptions:** a capability exists only if the Cloud will sign something that grants it — a licence certificate, a module bundle (ADR-007), or a membership certificate (ADR-012).

- **No `if plan == X` anywhere in the client.** A patched client gains nothing, because the Cloud still refuses to sign.
- The Admin caches the signed licence in `license_state` and verifies it locally. It enforces limits from the signed payload, not from a hardcoded table.

### 3. Licence lifetime and grace

| State | Trigger | Behaviour |
|---|---|---|
| Active | signed licence, `valid_until` in the future (TTL 30 days) | full operation |
| Refreshing | any Cloud contact | licence re-issued, anchor updated |
| Grace | `valid_until` passed, ≤14 days | full operation, prominent banner: "Licence needs to go online in N days" |
| Read-only | grace exhausted, or billing suspended past dunning | allow-list below |
| Plan 1 | perpetual local licence (`license_expiry = null`) | never expires, never needs the Cloud after activation |
| Bootstrap | never activated, ≤30 days from first launch | standard modules only, no Users (ADR-007, ADR-023) |

**Read-only allow-list** (what still works, always):
- Read all existing data
- **Export** any project, full fidelity, open formats
- Print / generate PDFs of existing records
- Take a **local** backup
- Verify the audit chain

Denied in read-only: create, update, delete, **restore from corbeille** (a restore is a write), module install, inviting users, Cloud backup upload.

**Data is never deleted, encrypted away, or made unexportable because of money** (Principle 14). Non-payment costs the ability to write, never the ability to leave.

### 4. Trial

14 days, Plan 3 feature set, no card required. At the end: pick a plan, or read-only. Trial data is kept and exportable indefinitely.

### 5. Billing

Stripe checkout + webhooks. Webhook handlers are idempotent and signature-verified.

Dunning: failed payment → retry at day 1, 3, 7 → emails at each step → day 14 read-only. Nothing is deleted. A successful payment restores full operation immediately on next licence refresh.

Payment state is Cloud metadata; the Console shows it, the customer portal shows it, and no business data is involved.

### 6. Downgrade behaviour

| Over-limit item | Behaviour |
|---|---|
| Users above the new limit | The Admin picks who stays active; the rest become read-only members. **Nobody is deleted.** |
| Projects above the new limit | The Admin picks one active project; others become read-only and exportable. |
| Custom module no longer entitled | Module disabled; its tables retained and exportable (ADR-011). |
| Backup quota exceeded | Oldest backups rotate out per retention; the customer is warned first. Local backups are never blocked. |

### 7. Time and clock policy

Expiry is checked against a **monotonic clock anchor**, never the raw wall clock:

```
trusted_now = max(last_seen_cloud_time, monotonic_anchor + elapsed_monotonic)
```

- `monotonic_anchor` and `last_seen_cloud_time` persist in `license_state` across restarts.
- Wall clock moved backwards → detected, logged, ignored for expiry purposes.
- Wall clock moved forwards → does not extend a licence; expiry uses the anchor.
- Anchor tampering (file deleted or rolled back) → treated as expiry-unknown → grace, then read-only.
- The same anchor governs module `license_expiry` (ADR-007) and certificate validity (ADR-012).

---

## Consequences

### Positive
- The owner adds plans and projects without a code release.
- Cracking the client buys nothing the Cloud will not sign.
- Offline operation is bounded and predictable: 30 days + 14 grace.
- Billing disputes can never destroy or trap customer data.
- One clock rule for licences, bundles and certificates.

### Negative
- Plan changes require re-signing licences and bundles. Accepted — rare.
- A customer offline for more than ~44 days must connect once. Stated clearly at purchase.
- The anchor is a client-side artifact and a determined attacker can attack it; the bound is that the Cloud will not sign past expiry regardless.

### Neutral
- `users_tested_ceiling` is an engineering statement, not a licence limit. Raising it requires a load-test ADR, not a marketing decision.
- Plan 1's perpetual licence is what makes local-only mode honest.

---

## Alternatives Considered

**Hardcoded plan tiers in the client.** Rejected: the owner cannot add plans, and a patched client bypasses it.

**Client-side `if plan == X` checks as the primary gate.** Rejected: trivially bypassed; entitlements must be signature-bound.

**Perpetual licences with no refresh.** Rejected: revocation becomes impossible; "stop renewing" only works with an expiry.

**Delete data on non-payment.** Rejected absolutely: Principle 14, and it is the fastest way to lose regulated customers.

**Trust the OS clock.** Rejected: rolling the clock back is the oldest licence bypass there is.

**Always-online licence check.** Rejected: contradicts local-first and Cloud-offline operation.

---

## Enforcement

- Lint: no client code may branch on a plan id or plan name for a capability decision.
- The licence verification function is the only reader of `license_state`; the anchor update function is the only writer.
- Every export path is reachable in every billing state — a CI test asserts export works in `read_only`, `grace`, `suspended`, and `bootstrap_expired`.
- Webhook handlers are idempotent and verified; a replayed webhook changes nothing.
- Plan edits require two-person approval and are audited (ADR-013).

### Tests
- [ ] Licence expiry → grace banner, full operation for 14 days
- [ ] Grace exhausted → read-only; read + export + print + local backup still work
- [ ] Restore from corbeille denied in read-only
- [ ] Clock rolled back 1 year → expiry still enforced
- [ ] Anchor file deleted → grace then read-only, never full operation
- [ ] Payment succeeds after suspension → full operation on next refresh
- [ ] Downgrade with 12 users on Plan 3 → 10 active, 2 read-only, zero deletions
- [ ] Plan 1 offline for 90 days → fully operational
- [ ] New plan created in the Console → assignable with no code change
- [ ] Patched client claims Plan 4 → Cloud refuses to sign custom-module bundles