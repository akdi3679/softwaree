# ADR-016: Data Lifecycle — Corbeille, Retention, Erasure, Read Audit

**Status:** Accepted — amended 2026-11-22
**Date:** 2026-11-20
**Amended:** 2026-11-22 — quota read from the signed licence; hard delete and erasure emit events through `apply_event`; projection-cache deletion moved outside the SQL transaction with a compensating rule; the "frozen result" rule stated precisely (no in-place mutation, correction-by-new-row allowed); `is_in_signed_report` flag and signed-report CHECK added
**Deciders:** Architecture team
**See also:** Principle 11, Principle 14, ADR-004 (events), ADR-005 (storage), ADR-012 (tables + key delivery), ADR-014 (quotas), ADR-015 (`recompute_derived`), ADR-022 (keys)

---

## Context

Six lifecycle questions, including the two that tie erasure to the sync model:

1. What is the corbeille quota measured on, and where does the number come from?
2. Retention vs immutability — "1 year" vs "never deleted".
3. Erasure vs an immutable log.
4. Read audit — who *viewed* a record, not just who wrote it.
5. Sensitive data is encrypted per-resource. Where do search indexes live, how do keys reach authorised Users, and how does a restore stay erased?
6. Erasure must also delete projection-cache snapshots, because they hold wrapped keys.

---

## Decision

### 1. Corbeille (soft delete)

A soft-deleted record moves to the Admin's `tombstones` table: the host serialises the row (plus who/when/why) into `tombstones` and **deletes the row from the live table in the same transaction**, as one `*.deleted` event through `apply_event`. A row may be tombstoned only if **no live row references it**; a delete that would orphan a dependant is refused with `ValidationError`.

Records that form a legal record — lab results, signed/delivered/superseded reports, and any sample that has results — are **never deleted**. They are archived by status/flag, which is not a delete, writes no tombstone and is reversible by a normal update. (v1-foodlab: only companies, categories, parameters and standards without dependants, draft reports, and draft samples without results can be tombstoned.)

- Quota = the serialized byte size of the Admin's local `tombstones` table.
- The quota value is an entitlement, read from the verified signed licence — never from a local setting, never from `admin_state.db`. A patched local number gains nothing, because the Cloud signs the limit (ADR-014, ADR-021).

| Plan | Corbeille quota |
|---|---|
| Plan 1 Local | local only |
| Plan 1+ Solo Cloud | 5 GB |
| Plan 2 Starter | 5 GB |
| Plan 3 Team | 50 GB |
| Plan 4 Enterprise | 500 GB |

- The Cloud stores deletion metadata only — who, when, resource type, project — never the deleted content.
- Restore is a normal write: it goes through the command handler, is authorised (`restore` action), and produces an event. It is therefore denied in read-only mode (ADR-014).
- When the quota is reached: the oldest tombstone is hard-deleted immediately. There is no `hard_delete_after` column and no second trash can.
- Hard delete is an event, not a silent `DELETE`. Quota eviction emits `tombstone.purged` and runs through `apply_event` like every other mutation. `tombstones` is a **Projected business table** (ADR-012 §5); a bare `DELETE` would make it diverge on replay and break the rebuild-and-diff test.

What "hard delete + 30-day recovery grace" means, precisely — and it differs by custody mode:

| Stage | Local state | Recovery path |
|---|---|---|
| Soft-deleted | In `tombstones`, counts against quota | Customer restores in-app, self-service |
| Hard-deleted | Removed from `tombstones` via `tombstone.purged`; resource key destroyed | **Assisted:** support-assisted restore from a pre-deletion backup within the backup retention window (30 days, ADR-021). **Zero-knowledge:** customer self-service restore with their recovery code within that window — staff hold no key and cannot help. |
| After the window | Backup rotation removes the last copies | None. Stated plainly at deletion time. |

The grace period is a property of **backup retention**, not a hidden second trash can. In zero-knowledge mode there is no support path at all — that is the mode's defining property, and the UI says so.

### 2. Retention windows

Cloud backups are retained for the plan's `backup_retention_days` (default 30, ADR-021), subject to the byte quota. The '30-day recovery grace' in §1 is exactly this window.

The plan's "1 year / 5 years / forever" is the availability window for **Cloud-held audit snapshots**. The Admin's local hash chain is **never deleted** in normal operation (Principle 11). These are two different things and are labelled differently everywhere.

### 3. Erasure vs immutability: crypto-shredding

Legal erasure is a **different operation** from quota-driven hard delete, and it is stronger.

**Where the pieces live:**

- **Resource content keys** → `resource_keys` (Admin platform table, **Host-state**), each wrapped by the Project Keyring Key (ADR-022). The same key encrypts that resource's sensitive fields in the live tables **and** that resource's payload inside `events`.
- **Blind indexes** → `blind_indexes` (Admin platform table, **Host-state**): `(resource_type, resource_id, field, token_hash)`. HMAC-SHA-256 of normalised search tokens under the Project Blind Index Key. This is how search works over encrypted fields without storing plaintext.
- **Erasure ledger** → `erasure_ledger` (Admin platform table, **Projected**): `(resource_type, resource_id, requested_at, basis, requested_by, entry_hash)`. Metadata only, permanent.

**Why keys are Host-state but the ledger is Projected.** Erasure requires destroying a resource key **irrecoverably**. If the wrapped key were carried in the immutable event log, replay would resurrect it and crypto-shredding would be void. So keys never enter `events`. The ledger, by contrast, is a business fact produced by an event (`resource.erased`) and must replay. Business tables still replay exactly, because sensitive fields are **ciphertext copied through** — `apply_event` needs no key to write them (ADR-012 §5).

**Erasure procedure — the durable part is one transaction:**

```text
1. Authorise the request (Admin, audited, requester identity + legal basis)
2. Emit `resource.erased` and run it through apply_event, in ONE transaction:
     BEGIN
       append_event(resource.erased)
       apply_event:
         destroy the resource_keys row for the resource
         delete all blind_indexes rows for the resource
         insert erasure_ledger entry { resource_type, resource_id,
                                       requested_at, basis,
                                       requested_by, entry_hash }
       append_audit (metadata only, no PII)
       insert outbox
     COMMIT
3. Send Purge for the resource to every member who holds it
   (they delete their projection rows AND their local key copies — ADR-012 §3/§4)
4. Delete the projection-cache files (see below — NOT inside the SQL transaction)
5. Flag prior Cloud backups as containing an erased resource
6. Notify the customer of the residual backup window in plain words
```

**Cache deletion is not inside the SQL transaction.** Projection-cache snapshots are files on disk (ADR-008); they cannot be committed or rolled back with SQLite. The ordering is explicit and compensating:

```text
1. COMMIT the transaction above (key destroyed, ledger + audit durable)
2. AFTER commit: delete every projection-cache file containing the resource
3. If step 2 fails: mark the cache directory poisoned, refuse to serve ANY
   cached snapshot, and rebuild. Log a security event. Never serve a stale cache.
```

The ledger is the durable guarantee; the cache is rebuildable. Destroying the key first means a cache file that survives step 2 holds a wrapped key whose plaintext no longer exists anywhere.

**Why delete projection-cache snapshots at all?** They contain wrapped resource keys per member. If a resource is erased and a cached snapshot survives, the next snapshot apply would re-deliver a wrapped key for a resource that must stay unreadable. Deleting them is safe: they are rebuildable, and the ledger re-shreds the resource on any rebuild or restore.

**The backup problem, solved honestly.** Old encrypted backups contain the key material as it existed at backup time. Two controls handle this:

- The **`erasure_ledger` is permanent and metadata-only**. Any restore — from any backup, on any device — **re-applies the ledger** after recovery and re-shreds those resources. Erased data cannot come back through a restore.
- Backups age out per the plan's retention. The customer is told the residual window rather than being told "erased everywhere instantly", which would be false.

**What we do not do:** delete or rewrite `events` or `audit_entries`. The chain stays intact and verifiable; the payload becomes unreadable. That is the whole point of crypto-shredding.

### 4. Read audit

Reads of sensitive records are audited, not just writes.

- Declared per module in the manifest (`sensitive_resources`). Viewing a patient, opening a lab result, exporting a report → audited.
- **Batched** to keep volume sane: one entry per `(actor, resource_type, resource_id, action, 5-minute bucket)` with an access count, rather than one entry per keystroke.
- **Flush ordering is deterministic.** Batched read-audit entries are written inside a normal Admin write transaction, which assigns their position in the hash chain. There is no out-of-band flush that could produce an unordered or dangling chain entry.
- Same table, same hash rule as Principle 11: the entry excludes `audit_seq` and `hash`, `prev_hash` is lowercase 64-char hex, and the tag is `platform.audit.v1`.
- Audit entries contain **metadata only** — never the sensitive payload itself. Otherwise audit becomes a second copy of the data and erasure becomes impossible.
- The Admin can produce a "who accessed this patient" report for compliance.

### 5. Corrections are new events

Business corrections never rewrite history. A correction is a new event carrying `supersedes_event_id`; the projection reflects the latest state, the log keeps both.

### 6. PDFs and binary assets as BLOBs

**PDFs, logos, and other binary assets are stored as BLOBs inside `project.db`**, not as external files (ADR-005). This ensures:

- They are encrypted (SQLCipher encrypts the whole DB).
- They are backed up (the backup is a copy of the DB).
- They survive restore (a restored lab does not lose its signed PDFs).

Signed PDFs (lab reports, certificates) are the legal record. They must be in the DB.

`mod_food_lab_reports` includes:

- `pdf_blob BLOB` — the actual PDF content
- `pdf_sha256 TEXT` — integrity hash
- `included_results TEXT` — JSON list of result IDs, frozen at generation time
- `content_sha256 TEXT` — hash of the report content at generation time
- `CHECK (status <> 'signed' OR (signed_by IS NOT NULL AND signed_at IS NOT NULL AND pdf_sha256 IS NOT NULL))` — a signed report without a signer or an integrity hash is not a legal record

**The frozen-result rule, stated precisely.** The two halves must not be confused:

- **Forbidden:** mutating a signed result **in place**, or recomputing it with a `recompute_derived` patch. A result listed in `included_results` of any report with status `signed`, `delivered` or `superseded` is frozen.
- **Allowed, and required for ISO 17025:** correcting it by emitting a **new** result row with `correction_of`, and superseding the report with a new row carrying `supersedes`. The original row and the original PDF blob are never touched.

To make the frozen check O(1) instead of a scan of every report's JSON, `mod_food_lab_results` carries **`is_in_signed_report INTEGER NOT NULL DEFAULT 0`**, set to 1 by `apply_event` when a `report.signed` event lists that result id. `recompute_derived` filters on it (ADR-015); the correction command does not.

The `report.signed` event's payload carries `included_results`, so `apply_event` can set `is_in_signed_report` without reading another table.

This is what makes Rule 2 enforceable and the correction acceptance test meaningful.
**Blob columns and replay.** `report.generated` and `settings.updated` carry the blob as base64 in their payload (`payload_format: jcs-plain`). Consequences, accepted for v1-foodlab: every PDF/logo exists twice (event log and table); list queries must never read `events.payload` or `pdf_blob`; because a frame is 16 MB (SYNC-PROTOCOL) and base64 adds 33%, a PDF larger than 10 MB is refused at generation with `ValidationError`. A later release may move blobs to a content-addressed table referenced by SHA-256 from the event, under a new `payload_format`.

### 7. Export and departure

- The Admin can export any project at any time, in open formats (JSON + CSV, PDF for reports), with no Cloud connection and in any billing state (Principle 14).
- Account closure: soft-delete, then a documented hard-delete schedule. Erasure requests are honoured through the ledger mechanism above.
- Uninstalled modules keep their tables, exportable and read-only (ADR-011).

---

## Consequences

### Positive
- The quota has a unit, a location and an authoritative source, so it can be implemented and tested.
- Retention and immutability stop contradicting each other.
- Erasure is real, verifiable, composes with sync (keys are purged on members), and is compatible with an append-only log.
- Erasure deletes projection-cache snapshots, preventing key re-materialisation — with an ordering that SQLite can actually honour.
- Eviction and erasure are events, so replay reproduces them and rebuild-and-diff stays true.
- Search works over encrypted fields via blind indexes.
- Read access to sensitive records is accountable, with deterministic chain ordering.
- Restores cannot resurrect erased data.
- PDFs are BLOBs, ensuring they are encrypted, backed up, and survive restore.
- The frozen-result rule is enforceable in O(1) and does not forbid lawful corrections.

### Negative
- Per-resource keys add a key table, a wrapping layer, and per-member key distribution.
- Blind indexes support token/prefix matching, not arbitrary `LIKE` queries, and are a dictionary-attack surface if the Blind Index Key leaks — hence a separate key and deletion on erasure.
- Read audit increases audit volume; batching is mandatory.
- Erasure has a residual backup window that must be disclosed rather than hidden.
- Zero-knowledge customers get no support-assisted recovery. That is the trade they chose.
- Storing PDFs as BLOBs increases DB size; acceptable for the security and backup guarantees. Queries must project columns explicitly rather than `SELECT *`.
- Cache deletion is eventually-consistent with a poisoned-cache fallback, not atomic. This is stated rather than pretended away.

### Neutral
- Which fields are "sensitive" is declared by the module manifest and reviewed at publish time (ADR-013).
- The ledger holds identifiers and hashes, never content, so it is safe to keep forever.
- In v1-foodlab the `erasure_ledger` table exists but stays empty. The restore path that re-applies it is real and tested with a fixture row; no v1 command emits `resource.erased` (`v1/DEVIATIONS.md` §7). v1.1 adds no table here.

---

## Alternatives Considered

- **Delete rows from `events` on erasure.** Rejected: breaks the hash chain and destroys the audit guarantee.
- **Rewrite the audit chain after erasure.** Rejected: a re-computable chain is not tamper-evident.
- **Store plaintext in audit entries.** Rejected: audit becomes a shadow copy and erasure becomes impossible.
- **Log every read individually.** Rejected: volume. Bucketed counting preserves accountability at a fraction of the cost.
- **"Erased everywhere immediately".** Rejected as a claim: backups exist. Ledger re-application plus disclosed retention is the honest version.
- **Blind indexes as columns inside module tables.** Rejected: erasure would have to iterate every module's schema. One platform table gives one deletion path.
- **Support-assisted recovery in zero-knowledge mode.** Rejected: impossible by definition; staff hold no key.
- **Keep projection-cache snapshots after erasure.** Rejected: they hold wrapped keys that would re-materialise the resource key on next apply.
- **Delete cache files inside the SQL transaction.** Rejected: files are not transactional. Attempting it produces a rollback path that cannot undo a file deletion. Commit-then-delete with a poisoned-cache fallback is the correct shape.
- **Silent `DELETE` at quota.** Rejected: `tombstones` is a Projected table; a silent delete makes replay diverge.
- **Carry wrapped resource keys in `events` so replay can rebuild them.** Rejected: it would make crypto-shredding impossible, because the key would live forever in the immutable log.
- **Forbid all correction of a signed result.** Rejected: ISO 17025 requires a correction path. Freeze in-place mutation, allow correction by new row.
- **Store PDFs as external files.** Rejected: lost on restore, unencrypted, not backed up.

---

## Enforcement

- The erasure function is the only path that destroys a `resource_keys` row. It emits `resource.erased`, and the ledger entry, blind-index deletion and audit entry all happen inside that one transaction.
- Quota eviction emits `tombstone.purged`. **Lint: no maintenance, eviction or patch path issues a bare `DELETE` against a Projected table.**
- Cache deletion runs after commit. Failure marks the cache directory poisoned and blocks all cached-snapshot serving until rebuild.
- The restore path **must** re-apply `erasure_ledger` before the project becomes writable. A CI test asserts this.
- Lint: no audit entry may contain a module-declared sensitive field.
- Lint: no code may `DELETE` from `events` or `audit_entries`.
- Lint: every hard-delete and erasure path deletes the matching `blind_indexes` rows and projection-cache files.
- Sensitive-read auditing is enabled per manifest; publishing a module with sensitive resources and no read-audit declaration is rejected.
- The corbeille quota is computed from `tombstones` serialized size, with a single implementation used by both UI and enforcement. **The limit is read from the verified licence payload.**
- PDFs and logos are stored as BLOBs; lint rejects file-path columns for binary assets.
- `is_in_signed_report` is written only by `apply_event` on `report.signed`. Lint: no command or patch sets it directly.

### Tests

- [ ] Soft delete → tombstone created, quota increases by its serialized size
- [ ] Quota reached → oldest tombstone hard-deleted via `tombstone.purged`, key destroyed, customer notified
- [ ] Quota value altered in a local settings table → ignored; the signed licence limit governs
- [ ] Restore from corbeille → produces an event; denied in read-only mode
- [ ] Erasure → ciphertext remains, plaintext unrecoverable, chain still verifies
- [ ] Erasure → blind-index rows gone, search no longer finds the record
- [ ] Erasure → projection-cache files deleted
- [ ] Cache deletion fails → directory poisoned, no cached snapshot served, security event logged
- [ ] Erasure → members' local key copies purged; they can no longer decrypt
- [ ] Restore a pre-erasure backup → ledger re-applied, resource still unreadable
- [ ] Zero-knowledge hard-delete recovery → customer-code path works, staff path absent
- [ ] Sensitive read → bucketed audit entry with count, no payload, chain order deterministic
- [ ] "Who accessed this patient" report matches the audit chain
- [ ] Correction → new event with `supersedes_event_id`, history intact
- [ ] Export works offline, in read-only, and after module uninstall
- [ ] Cloud audit snapshot expires at the plan window; local chain untouched
- [ ] PDF stored as BLOB survives backup/restore; integrity verified via `pdf_sha256`
- [ ] Report with status `signed` and a NULL `pdf_sha256` → CHECK rejects the insert
- [ ] `report.signed` → every listed result gets `is_in_signed_report = 1`
- [ ] `recompute_derived` on a frozen result → refused and audited
- [ ] Correction by new row on a frozen result → succeeds; original row and PDF unchanged
- [ ] Rebuild-and-diff after eviction and erasure → Projected tables match exactly