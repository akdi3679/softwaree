# ADR-021: v1 Plan Tier — Plan 1+ (Solo Cloud)

**Status:** Accepted — amended 2026-11-20
**Amends:** `docs/architecture/00-OVERVIEW.md` §7 (adds one row; changes none)
**Amended:** licence shape added; audit retention terminology aligned with ADR-016

## Context

`00-OVERVIEW.md` §7 defines four plans. v1 as drafted matches **none** of them:

| | Plan 1 Local | Plan 2 Starter | v1 draft |
|---|---|---|---|
| Users | 0 | up to 3 | **0** |
| Cloud backup | ✗ | daily | **daily** |
| Audit retention | local only | 1 year | **anchored to Cloud** |
| Key escrow | — | ✓ | **✓** |

v1 needs 0 Users (to ship fast) but also needs cloud backup and escrow,
because acceptance tests #8 (restore / laptop died) and #12 (expiry and
renewal) are meaningless without them. Dropping backup to match Plan 1
would gut the recovery guarantee that is the product's main promise.

No price appears anywhere in the original architecture.

## Decision

Add **Plan 1+ (Solo Cloud)** to the plan table. It sits between Plan 1 and
Plan 2. No existing plan changes.

| Feature | Plan 1+ (Solo Cloud) |
|---|---|
| Admin user count | 1 |
| Project count | 1 |
| User count | **0** |
| Cloud backup | daily |
| Backup time (admin picks) | 00:00–06:00 local |
| Backup storage quota | 10 GB |
| Manual backup | ✗ |
| Custom modules | ✗ |
| Audit snapshot retention | 1 year (Cloud-held snapshot availability; local chain never deleted — ADR-016) |
| Modules included | food-lab |
| Licence shape | **30-day renewable** (refreshed every 7 days, 14-day grace — ADR-014) |
| Price | **149 TND / month**, 14-day trial |

### Module scope is a milestone, not a redefinition

`00-OVERVIEW.md` §6 states "v1 ships exactly these two modules"
(medical-reception + food-lab). This v1 document set ships **food-lab only**.

That is a **scope reduction of the milestone**, not a claim that the
architecture's v1 is one module. medical-reception is added later as a new
signed bundle — a new `mod_medical_reception_*` table set, no migration to
existing data. To avoid the naming collision, this milestone is referred to
as **v1-foodlab** in build docs.

## Consequences

- **Positive:** every v1 acceptance test remains meaningful. The plan table
  gains a row; enforcement code is unchanged because it is capability-driven.
- **Negative:** five plans instead of four. Accepted.
- **Neutral:** upgrading Plan 1+ → Plan 2 is a license re-issue (User count
  0 → 3), not a data migration.

## Enforcement

Plan capabilities are **data, not code**. The license bundle carries a
capability set; the Admin reads it. Adding a plan must never require a
client binary change. Entitlements are enforced by **what the Cloud will
sign**, never by `if plan == X` in the client (ADR-014).

## Still open

**D-3 — payment provider.** Stripe does not settle TND. Options: bill
EUR/USD via Stripe, or a Tunisian PSP (Konnect / Paymee / Flouci). If the
chosen PSP has no recurring support, v1 uses **prepaid periods + manual
renewal**, which fits the license TTL model with no design change.