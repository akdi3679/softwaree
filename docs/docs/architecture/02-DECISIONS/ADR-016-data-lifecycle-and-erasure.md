# ADR-016: Data Lifecycle — Corbeille, Retention, Erasure, Read Audit

**Status:** Accepted — amended 2026-11-20 (gap-fix pass)
**Date:** 2026-11-20
**Deciders:** Architecture team
**See also:** Principle 11, Principle 14, ADR-004 (events), ADR-005 (storage), ADR-012 (tables + key delivery), ADR-014 (quotas), ADR-022 (keys)

---

## Context

Four lifecycle questions, plus the one that ties erasure to the sync model:

1. What is the corbeille quota measured on?
2. Retention vs immutability — "1 year" vs "never deleted".
3. Erasure vs an immutable log.
4. Read audit — who *viewed* a record, not just who wrote it.
5. **Sensitive data is encrypted per-resource. Where do the search indexes live, how do keys reach authorized Users, and how does a restore stay erased?**

## Decision

### 1. Corbeille (soft delete)

- A soft-deleted record moves to the Admin's `tombstones` table. The business row is removed from the live table; the tombstone holds the serialized record plus who/when/why.
- **Quota = the serialized byte size of the Admin's local `tombstones` table.** Plan 1: local only. Plan 2: 5 GB. Plan 3: 50 GB. Plan 4: 500 GB (ADR-014).
- The Cloud stores **deletion metadata only** — who, when, resource type, project — never the deleted content.
- Restore is a normal write: it goes through the command handler, is authorised (`restore` action), and produces an event. It is therefore denied in read-only mode (ADR-014).

**When the quota is reached:** the oldest tombstone is hard-deleted.

**What "hard delete + 30-day recovery grace" means, precisely — and it differs by custody mode:**

| Stage | Local state | Recovery path |
|---|---|---|
| Soft-deleted | In `tombstones`, counts against quota | Customer restores in-app, self-service |
| Hard-deleted | Removed from `tombstones`; resource key destroyed | **Assisted mode:** support-assisted restore from a pre-deletion backup within 30 days (escrow release per ADR-022). **Zero-knowledge mode:** customer self-service restore using their own recovery code within 30 days — staff cannot help, because staff hold no key. |
| After 30 days | Backup rotation removes the last copies | None. Stated plainly at deletion time. |

The grace period is a property of **backup retention**, not a hidden second trash can. **In zero-knowledge mode there is no support path at all** — that is the mode's defining property, and the UI says so.

### 2. Retention windows

The plan's "1 year / 5 years / forever" is the availability window for **Cloud-held audit snapshots**. The Admin's local hash chain is **never deleted** in normal operation (Principle 11). These are two different things and are labelled differently everywhere.

### 3. Erasure vs immutability: crypto-shredding

Legal erasure is a **different operation** from quota-driven hard delete, and it is stronger.

**Where the pieces live:**
- **Resource content keys** → `resource_keys` (Admin platform table), each wrapped by the Project Keyring Key (ADR-022). The same key encrypts that resource's sensitive fields in the live tables **and** that resource's payload inside `events`.
- **Blind indexes** → `blind_indexes` (Admin platform table): `(resource_type, resource_id, field, token_hash)`. HMAC-SHA-256 of normalised search tokens under the Project Blind Index Key. This is how search works over encrypted fields without storing plaintext.

**Erasure procedure:**
```
1. Authorise the request (Admin, audited, requester identity + legal basis)
2. BEGIN
     destroy the resource_keys row for the resource
     delete all blind_indexes rows for the resource
     insert erasure_ledger entry { resource_id, requested_at, basis, hash }
     insert audit entry (metadata only, no PII)
   COMMIT
3. Send Purge for the resource to every member who holds it
   (they delete their projection rows AND their local key copies — ADR-012 §4/§5)
4. Flag prior Cloud backups as containing an erased resource
5. Notify the customer of the residual backup window in plain words
```

**The backup problem, solved honestly.** Old encrypted backups contain the key material as it existed at backup time. Two controls handle this:

- The **`erasure_ledger` is permanent and metadata-only**. Any restore — from any backup, on any device — **re-applies the ledger** after recovery and re-shreds those resources. Erased data cannot come back through a restore.
- Backups age out per the plan's retention. The customer is told the residual window rather than being told "erased everywhere instantly", which would be false.

**What we do not do:** delete or rewrite `events` or `audit_entries`. The chain stays intact and verifiable; the payload becomes unreadable. That is the whole point of crypto-shredding.

### 4. Read audit

Reads of sensitive records are audited, not just writes.

- Declared per module in the manifest (`sensitive_resources`). Viewing a patient, opening a lab result, exporting a report → audited.
- **Batched** to keep volume sane: one entry per `(actor, resource_type, resource_id, action, 5-minute bucket)` with an access count, rather than one entry per keystroke.
- **Flush ordering is deterministic.** Batched read-audit entries are written inside a normal Admin write transaction, which assigns their position in the hash chain. There is no out-of-band flush that could produce an unordered or dangling chain entry.
- Same table, same hash rule: `SHA-256("platform.audit.v1" || prev_hash || JCS(entry))`.
- Audit entries contain **metadata only** — never the sensitive payload itself. Otherwise audit becomes a second copy of the data and erasure becomes impossible.
- The Admin can produce a "who accessed this patient" report for compliance.

### 5. Corrections are new events

Business corrections never rewrite history. A correction is a new event carrying `supersedes_event_id`; the projection reflects the latest state, the log keeps both.

### 6. Export and departure

- The Admin can export any project at any time, in open formats (JSON + CSV, PDF for reports), with no Cloud connection and in any billing state (Principle 14).
- Account closure: soft-delete, then a documented hard-delete schedule. Erasure requests are honoured through the ledger mechanism above.
- Uninstalled modules keep their tables, exportable and read-only (ADR-011).

---

## Consequences

### Positive
- The quota has a unit and a location, so it can be implemented and tested.
- Retention and immutability stop contradicting each other.
- Erasure is real, verifiable, composes with sync (keys are purged on members), and is compatible with an append-only log.
- Search works over encrypted fields via blind indexes.
- Read access to sensitive records is accountable, with deterministic chain ordering.
- Restores cannot resurrect erased data.

### Negative
- Per-resource keys add a key table, a wrapping layer, and per-member key distribution.
- Blind indexes support token/prefix matching, not arbitrary `LIKE` queries, and are a dictionary-attack surface if the Blind Index Key leaks — hence a separate key and deletion on erasure.
- Read audit increases audit volume; batching is mandatory.
- Erasure has a residual backup window that must be disclosed rather than hidden.
- Zero-knowledge customers get no support-assisted recovery. That is the trade they chose.

### Neutral
- Which fields are "sensitive" is declared by the module manifest and reviewed at publish time (ADR-013).
- The ledger holds identifiers and hashes, never content, so it is safe to keep forever.

---

## Alternatives Considered

**Delete rows from `events` on erasure.** Rejected: breaks the hash chain and destroys the audit guarantee.

**Rewrite the audit chain after erasure.** Rejected: a re-computable chain is not tamper-evident.

**Store plaintext in audit entries.** Rejected: audit becomes a shadow copy and erasure becomes impossible.

**Log every read individually.** Rejected: volume. Bucketed counting preserves accountability at a fraction of the cost.

**"Erased everywhere immediately".** Rejected as a claim: backups exist. Ledger re-application plus disclosed retention is the honest version.

**Blind indexes as columns inside module tables.** Rejected: erasure would have to iterate every module's schema. One platform table gives one deletion path.

**Support-assisted recovery in zero-knowledge mode.** Rejected: it is impossible by definition and would be a false promise.

---

## Enforcement

- The erasure function is the only path that destroys a `resource_keys` row, and it always writes the ledger entry and audit entry in the same transaction.
- The restore path **must** re-apply `erasure_ledger` before the project becomes writable. A CI test asserts this.
- Lint: no audit entry may contain a module-declared sensitive field.
- Lint: no code may `DELETE` from `events` or `audit_entries`.
- Lint: every hard-delete and erasure path deletes the matching `blind_indexes` rows.
- Sensitive-read auditing is enabled per manifest; publishing a module with sensitive resources and no read-audit declaration is rejected.
- The corbeille quota is computed from `tombstones` serialized size, with a single implementation used by both UI and enforcement.

### Tests
- [ ] Soft delete → tombstone created, quota increases by its serialized size
- [ ] Quota reached → oldest tombstone hard-deleted, key destroyed, customer notified
- [ ] Restore from corbeille → produces an event; denied in read-only mode
- [ ] Erasure → ciphertext remains, plaintext unrecoverable, chain still verifies
- [ ] Erasure → blind-index rows gone, search no longer finds the record
- [ ] Erasure → members' local key copies purged; they can no longer decrypt
- [ ] Restore a pre-erasure backup → ledger re-applied, resource still unreadable
- [ ] Zero-knowledge hard-delete recovery → customer-code path works, staff path is absent
- [ ] Sensitive read → bucketed audit entry with count, no payload, chain order deterministic
- [ ] "Who accessed this patient" report matches the audit chain
- [ ] Correction → new event with `supersedes_event_id`, history intact
- [ ] Export works offline, in read-only, and after module uninstall
- [ ] Cloud audit snapshot expires at the plan window; local chain untouched