# v1 Deviations from Final Architecture

**Status:** Locked
**Purpose:** Explicitly document what is deferred in the v1-foodlab milestone.
These are **approved, bounded deviations**, not silent violations. Each has
a clear path to closure in v1.1 or later milestones.

---

## 1. Bootstrap Bundles (ADR-023)
**Big doc rule:** The app ships with root-only signed bootstrap bundles for
standard modules, allowing 30 days of fully functional offline use before
activation.
**v1 deviation:** v1-foodlab ships **no embedded bootstrap bundles**. The
food-lab module requires one online activation. Local signup, key generation
and project creation still work with no network; the shell runs and the
project is readable, but module pages show "Activate to begin".
**Why:** Simplifies the v1 release and installer. The bundle format and
bootstrap rules are fully defined in ADR-007/023 so enabling it later is a
packaging change, not a format change.
**Closure:** v1.1 (ships bootstrap bundles and the offline activation file).

## 2. Zero-Knowledge Custody Mode (ADR-022)
**Big doc rule:** Customers can choose zero-knowledge mode, where the Backup
Key is wrapped only to their recovery code, and the Cloud holds nothing usable.
**v1 deviation:** v1-foodlab is **assisted-mode only**. The Backup Key is
wrapped to the Cloud's Escrow public key.
**Why:** Zero-knowledge requires a robust recovery code UI, rotation logic,
and explicit customer education that is out of scope for the initial food-lab
release.
**Closure:** v1.1 (User app rollout includes ZK mode UI).

## 3. Roles UI and Multi-User (ADR-012)
**Big doc rule:** The Admin can define roles, assign permissions, and manage
multiple Users who hold authorized projections.
**v1 deviation:** v1-foodlab is **single-user (Admin only)**. The `profiles`
table exists with one admin row. The `roles`, `role_permissions`, and
`member_roles` tables are deferred to v1.1.
**Why:** The core value of v1 is proving the event-sourced, signed-module
architecture for a single lab. Multi-user sync adds significant complexity
(cursors, purges, grant backfills) that is additive.
**Closure:** v1.1 (User app milestone).

## 4. Medical-Reception Module
**Big doc rule:** Architecture v1 includes both `medical-reception` and
`food-lab`.
**v1 deviation:** v1-foodlab ships **only the food-lab module**.
**Why:** Scope reduction for the first milestone. The architecture supports
adding `medical-reception` later as a new signed bundle with its own
`mod_medical_reception_*` table prefix, requiring no migration to existing
data.
**Closure:** v1.1 or v1-medical milestone.

Other verticals (dental, vet, pharmacy, …) are likewise post-v1. v1-foodlab
ships `food-lab` only. Adding one later is a new bundle, not a migration.


## 5. Plan 1 (Local) Offering (ADR-021)
**Big doc rule:** Plan 1 is a perpetual local tier with no Cloud backup.
**v1 deviation:** Plan 1 is **not offered** in v1-foodlab. Only Plan 1+
(Solo Cloud) is available.
**Why:** The v1 acceptance tests (specifically Test #8: "laptop died"
recovery) depend entirely on cloud backup and escrow. Offering a plan with
no backup undermines the core product promise and creates catastrophic
data-loss risk for food labs. Plan 1 may be introduced in later milestones
as a one-time paid tier with explicit "no backup" warnings.
**Closure:** v1.1 or later (requires explicit UI warnings and adjusted
acceptance tests).

## 6. Offline Activation File (ADR-023 §5)
**Big doc rule:** air-gapped sites activate with a signed offline activation file.
**v1 deviation:** not built. Activation is online only.
**Why:** it depends on bootstrap/activation packaging that is deferred (§1).
**Closure:** v1.1.

## 7. Per-resource encryption, blind indexes, read-audit, crypto-shredding (ADR-016, ADR-012)
**Big doc rule:** sensitive data is encrypted per resource, searchable through blind indexes, erasable by destroying the resource key; reads of sensitive records are audited.
**v1 deviation:** data is encrypted **at rest by SQLCipher only**. `events.payload_format` is `jcs-plain`. There are no `resource_keys` or `blind_indexes` tables and no read-audit. No command emits `resource.erased`, so `erasure_ledger` stays empty. Hard delete removes the tombstone copy only; **the plaintext also remains in the `events` log**, so v1-foodlab **cannot honour a legal erasure request**. Lab records are retained anyway for ISO 17025; any erasure request in this milestone is handled manually and declined or escalated.
**Test coverage:** `restore_from_backup` still calls `reapply_erasure_ledger()`; it is covered by a fixture ledger row and does nothing destructive until v1.1.
`apply_event` for `resource.erased` exists but no v1 command emits it; test 23 covers `tombstone.purged` only.
**Closure:** v1.1 adds resource keys, blind indexes, read-audit and a snapshot-protected re-encryption of existing rows/events.

## 8. Users, sync, mesh, discovery, relay (ADR-004, 008, 012, 017–020, 024)
**v1 deviation:** none of it is built. The event log and command layer are shaped so adding it is additive (acceptance test 6).
**Closure:** v1.1.

---

## Enforcement
- CI checks assert that no code path accidentally enables these deferred
  features in v1.
- Any attempt to implement these features in v1 without an ADR amendment
  will be rejected in code review.
- The `v1/KEY-SCOPE.md` file explicitly marks the deferred keys and tables
  as "slot reserved, not used in v1".