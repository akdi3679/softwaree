01-PRINCIPLES.md

# Architecture Principles — 14 Non-Negotiable Rules

> **Status:** Locked
> **Last updated:** 2026-11-22
> **Audience:** every engineer, every AI agent, every code review

These are the rules that **cannot be broken** without an ADR. They are not aspirational. They are enforced by code, lint rules, and code review.

---

## 1. One Owner Per Datum

Every piece of data has exactly one system that owns it. No dual ownership. No "shared" tables. No implicit copies that pretend to be authoritative.

| Datum | Owner | Everyone else holds |
|---|---|---|
| Account identity | Cloud | nothing |
| Project identity | Cloud | Admin caches the registry entry |
| Project business data | **Admin** | Users hold authorized projections only |
| User identity (account) | Cloud | Admin references by `user_id` |
| User membership in project | Cloud (membership metadata) + Admin (roles + permissions) | — |
| Role catalogue and permission lists | **Admin only** | Cloud never holds them |
| Module-access list (coarse) | Admin (authoritative) | Cloud holds a synced copy, for bundle issuance only |
| Device identity | Cloud (public keys) + Device (private keys) | — |
| Plans and entitlements | Cloud (**as data**, ADR-014/021) | Admin caches the signed licence |
| Module identity & signing | Cloud (signs) | Admin verifies, User verifies |
| Audit (business) | Admin | Cloud receives hash-chain snapshots |
| Audit (platform, owner actions) | Cloud | — |
| Backup blobs | Cloud (encrypted storage) | Admin encrypts before sending |
| Backup keys | **Assisted mode:** Cloud HSM-escrowed, wrapped. **Zero-knowledge mode:** customer only | Custody mode is per project (ADR-022) |
| Project data keys (DB, keyring, blind index, cache) | Admin device keychain | never in the Cloud in usable form |
| Resource keys + erasure ledger | Admin | never in the Cloud |
| Soft-deleted records (corbeille) | Admin (data) + Cloud (metadata) | quota = local tombstone bytes (ADR-016) |
| Device endpoints (metadata) | Cloud (discovery, **observed** source IP + probe-verified UDP port) | Devices know their own |
| Sync data | Admin ↔ User (direct, punched, or relayed ciphertext) | Cloud never sees plaintext |

**If you find yourself adding data to two systems and keeping them in sync, you are doing it wrong.** Pick the owner. The other holds a projection.

---

## 2. One Project = One Admin

A project has exactly one Admin device at any time. There is no "co-admin," no "admin team," no "two admins in different time zones." When the Admin device changes:

1. The old Admin device's public key is revoked by the Cloud.
2. The new device generates its own two keypairs (Ed25519 + X25519).
3. Recovery verification authorizes the new device (ADR-010, ADR-022).
4. The Cloud issues a new Admin authority certificate and bumps `revocation_epoch`.
5. The new device becomes the sole authority; module bundles are re-bound; Users resync.

Both devices may exist briefly during transition, but only one is `ACTIVE`. The Cloud is the source of truth for "who is the Admin right now"; Users verify that answer locally via the authority certificate (ADR-012).

The Admin app may run **headless on an always-on mini-PC** (ADR-002). That is still one Admin — not a second writer.

---

## 3. Admin Offline = No Authoritative Writes

If the Admin is not available, the User cannot perform any operation that requires Admin authority. The User app shows clearly:

- `ADMIN_ONLINE` — full operation
- `ADMIN_OFFLINE` — read-only (cached data only), no writes accepted
- `ADMIN_UNKNOWN` — no path to the Admin; we cannot tell whether it is up

These three names are used identically in the UI, the sync protocol and ADR-009. The command-sending function returns **`Error::AdminOffline`**.

The User app **must not** show "Success" for a write that has not been committed by the Admin. There is no `PENDING` state in v1 and no offline queue.

**One clarification that is not an exception:** after the Admin commits and replies with the applied sequence, the User's projection catches up via the event stream. During that window the UI may say *"Saved on Admin — updating your view."* The authoritative write **has already committed**; this is projection lag, not a pending write (ADR-009, ADR-012).

---

## 4. Events Live With Their Transaction — And There Is One `apply_event`

A business state change and the event that announces it **must be committed in the same database transaction**. If the transaction rolls back, no event exists. If it commits, the event is durable.

**Events are state deltas.** There is exactly **one `apply_event` function** in the codebase that turns an event into table state — on the Admin when authoring, on the User when projecting. No code path writes business tables except through it.

Correct (the transaction is opened by host code; `apply_event` is a **Rust function**, not SQL — SQLite has no stored procedures):

~~~rust
// Admin host code — one transaction, one apply_event
let tx = conn.transaction()?;

// 1. Idempotency check (inside the transaction)
let existing = tx.query_command_log(actor_id, idempotency_key)?;
if let Some(row) = existing {
    if row.request_hash != compute_hash(&command_payload) {
        return Err(Error::IdempotencyConflict);
    }
    return Ok(row.result_payload);
}

// 2. Optimistic concurrency check
check_expected_version(&tx, aggregate_id, expected_version)?;

// 3. Append the event (the state delta) — the source of truth
let sequence = tx.next_sequence()?;  // COALESCE(MAX(sequence),0)+1, gapless
tx.insert_event(&event)?;

// 4. Apply it to the tables through the ONE apply_event function
apply_event(&tx, &event)?;  // the UPDATE happens inside, never ad-hoc

// 5. Outbox + audit, same transaction
tx.insert_outbox(event.sequence)?;
tx.insert_audit(&audit_entry)?;  // hash-chained

// 6. Record the command LAST (result_payload now exists)
tx.insert_command_log(actor_id, idempotency_key, command_type,
                      request_hash, tx_id, result_payload)?;

tx.commit()?;
// Now and only now can we notify clients
~~~

Wrong:

~~~
UPDATE patients ...
send_to_user()        -- if this fails, DB changed but clients don't know
INSERT INTO outbox ...
~~~

This is the Transactional Outbox pattern. Non-negotiable.

**Event envelope (minimum):** `sequence`, `event_id`, `event_type`, `resource_type`, `resource_id`, `module_id`, `module_version`, `actor_id`, `project_id`, `tx_id`, `event_version`, `aggregate_version`, `payload_format`, `payload`, `idempotency_key`. Corrections carry `supersedes_event_id`; history is never rewritten (ADR-016).

`module_version` pins replay to the module build that produced the event (ADR-006). `aggregate_version` carries optimistic concurrency. `payload_format` is `jcs-plain` or `jcs-enc-v1` (ADR-016). These exist from v1 so v1.1 needs no log migration.

**Data patches obey this rule too.** The typed-op compiler produces row operations; the host wraps them as `patch.applied` events and executes them through `apply_event` (ADR-015 §3.3). There is no second table mutator, and patches are therefore replayable.

---

## 5. Authorization Is Re-Checked At Every Boundary

A permission decision is valid only for the moment and context it was made. If anything changes — permission revoked, role changed, project state changed, module version changed — the next operation is re-evaluated from scratch.

Permissions are `module.resource.action`, per resource type in v1. The decision is the **union of all roles** the member holds, evaluated against the live tables (ADR-012).

In particular, **event delivery re-checks authorization at delivery time**, not at event creation:

~~~
for event in range(range_start, range_end):
    if (!canRead(member, event.resource, currentPermissions)):
        markSkipped(member, event.sequence, reason: "denied")
        continue
    if (!moduleCompatible(member, event.module_id)):
        markSkipped(member, event.sequence, reason: "module_incompatible")
        continue
    deliver(member, event)   // includes wrapped resource key, ADR-012 §4
~~~

Every batch declares its range. The cursor advances to `range_end`; skipped events are recorded explicitly. **A gap inside a delivered range means "not authorized", never "lost."**

Permission changes have consequences, not just flags:

- **Grant** → partial backfill snapshot of the newly authorized resources (ADR-008).
- **Revoke** → `Purge` frame; best-effort deletion of rows **and local key copies** on the User, honestly described.
- Both bump `permission_version` and invalidate cached snapshots **before** the change is acknowledged.

---

## 6. Commands Are Idempotent

Every command carries an `idempotency_key` (UUIDv7 from the client). If the same command arrives twice — network retry, crash mid-process, reconnect — the system processes it exactly once.

Implementation: `command_log` is keyed by **`(actor_id, idempotency_key)`** and stores `request_hash` plus the result. The lookup happens **inside** the write transaction, never before it. Same key + same request → return the stored result. Same key + **different** request → **`IdempotencyConflict`**, never a silent second effect. The composite primary key is the concurrency backstop.

Keys are never pruned younger than 30 days; pruning older keys is safe because no client retries that far back. This is what makes the system safe against network failure without distributed transactions.

---

## 7. Never Trust The Client

The Admin app, the User app, and any module or module UI running inside them are untrusted from the Cloud's perspective. Even a fully-authenticated request is re-validated server-side:

- Is the device key valid and ACTIVE?
- Is the session fresh (Cloud API calls only — project operation uses certificates, ADR-012)?
- Is the project in the right state (ACTIVE, not SUSPENDED, not DELETED)?
- Is the actor authorized for **this specific operation**, not merely "this role exists"?

The same applies inside the Admin: **modules and their sandboxed UIs are untrusted even though we signed them.** Signing proves origin, not safety. Every host call and every bridge message is schema-validated and authorized (ADR-006, ADR-011).

A buggy or malicious client must not be able to escalate privileges by sending crafted payloads. The server is the final gate.

---

## 8. Modules Cannot Cross Borders

A module can only:

- Read its own declared tables (`mod_<name>_*`)
- Use the official host API (commands and queries declared in its manifest)
- Receive data through the projection layer, never raw table access
- Render UI inside an opaque-origin iframe with the CSP and bridge defined in ADR-011

A module cannot:

- Touch another module's tables
- Bypass the authorization layer
- Read or write the audit log
- Spawn processes outside the WASM sandbox
- Make network calls except through an explicit capability grant — and its **UI has no network at all** (`connect-src 'none'`)
- Reach keys, the filesystem, host DOM, cookies or storage
- Pass raw SQL as a filter — filters are structured, typed enums

Enforced by: capability-based WASI grants, SQL table-prefix isolation, the iframe sandbox + nonce CSP, the allow-listed bridge dispatcher, and lint rules (no undeclared host imports, no `db.execute` outside the owning module).

---

## 9. Backups Are Encrypted Before They Leave — And Custody Is Stated Honestly

The Admin encrypts each backup with a fresh **Backup Key** before it leaves the device. What the Cloud can do next depends on the project's custody mode, and we say so in plain words (ADR-022):

- **Assisted recovery (default):** the Cloud stores ciphertext **and** an HSM-wrapped copy of the Backup Key. It *can* decrypt — but only through a controlled recovery: customer re-authentication, a **48-hour waiting period**, **out-of-band alerts to every account contact with a cancel link**, **quorum approval** (two-person default, one-person with delay for solo owners), and a full audit trail.

The claim we make: *"We cannot read your backups without a controlled, audited recovery that alerts you."*

The claim we never make: *"we can't read your backups."*

- **Zero-knowledge mode:** the Backup Key is wrapped only to the customer's recovery code. The Cloud stores nothing usable and **cannot** decrypt. Lost code = lost data. The UI states this at enrolment and at every manual backup.

**Key rules (ADR-022 is authoritative):** one key, one purpose. Random 32-byte keys. **No key is ever derived from a signing key.** The account password is never a data key. Device signing (Ed25519) and device encryption (X25519) are separate keypairs. Database, keyring, blind-index and cache keys are distinct. Backup encryption is separate from the database key.

Plan 4 manual backups may add a passphrase; that wrapping key is **never escrowed**. Forgotten passphrase = unrecoverable archive, by design.

Every escrow access is logged, audited and alerted. Restores re-apply the erasure ledger before the project becomes writable (ADR-016).

---

## 10. Updates Are Atomic, Verified, And Reversible — Including Data and Logic

Every update (core, app, module, **data, schema, logic**) follows one pipeline:

1. Discover → Download → **Verify signature**
2. Snapshot the project into `snapshots/recovery/` if data is modified
3. Acquire the project lock (no new commands, drain the outbox)
4. Dry run where applicable, then apply in a single transaction
5. Verify post-apply
6. Commit
7. Broadcast affected events to Users
8. On failure: **pre-commit → rollback; post-commit → restore from the snapshot. Never a downgrade of schema or code.**

**Update types:**

- **Schema migration:** forward-only DDL with backfill in the same transaction
- **Data patch:** a **typed operation** from an allow-list (`set_field`, `backfill_field`, `normalize_enum`, `soft_delete_rows`, `reindex`, `recompute_derived`), compiled to SQL locally by the Admin, with target-table allow-lists, row-count caps and a mandatory dry run. **Never raw SQL from the Cloud.**  , -- "rename_field is deliberately absent: it breaks expand/contract, so a rename is backfill_field + a code release + a later column drop."
- **Logic module:** a signed, encrypted WASM bundle plus its signed UI (ADR-007, ADR-011)
- **Security override:** force-revoke, force-rotate, applied to open sessions

**Patches can never touch** `events`, `audit_entries`, `command_log`, `resource_keys`, `blind_indexes`, `erasure_ledger`, `membership_certs`, `license_state`, `mesh_peers`, `user_projections`, `schema_version`, or another module's tables. This is enforced in the compiler, not by review.

The Cloud is **authoritative for updates**; the Admin is the executor. This is the "live heart" — under strict blast-radius controls (ADR-015):

- A **separate, offline patch-signing key**, quorum signing ceremony
- **Ring rollouts** 5% → 25% → 100%, with automatic health gates
- A **pre-signed kill-switch** (`halt_and_restore`) shipped with every critical patch, signed with the **patch key** (never the app-updater key)

**Critical updates have a deadline.** If it passes unapplied, the app enters **restricted mode**: business writes are refused, while reading, exporting, printing and local backup remain available. A security deadline must never make the customer's data unreachable (Principle 14). *(This refines the earlier "refuses to start" wording.)*

Non-critical updates queue for 24 h; the customer may inspect a human-readable diff summary and refuse. Refusal is audited.

A failed update leaves the system exactly as before. There is no half-updated state. If an update cannot be made safe, it does not ship.

---

## 11. Audit Is Append-Only And Tamper-Evident

Audit records are never updated or deleted in normal operation. They are hash-chained.

**Hash rule (one implementation, shared with bundle hashing):**

~~~
entry          = the audit row WITHOUT `audit_seq` and WITHOUT `hash`
                 (audit_seq is assigned by the INSERT; hash is what we are computing)
hash           = SHA-256( "platform.audit.v1" || prev_hash_hex || JCS(entry) )
prev_hash_hex  = previous row's hash as lowercase 64-character hex
~~~

JCS is RFC 8785 canonical JSON. All hashes in concatenations and JSON tuples are **lowercase 64-character hex** — fixed length, so concatenation is unambiguous. Variable-length concatenation without a fixed-length or length-prefixed encoding is forbidden.

**Reads of sensitive records are audited too**, not just writes — viewing a patient, opening a lab result, exporting a report. Read entries are batched per `(actor, resource_type, resource_id, action, 5-minute bucket)` with an access count. **Flush ordering is deterministic**: batched read-audit entries are written inside a normal Admin write transaction, which assigns their position in the hash chain. There is no out-of-band flush that could produce an unordered or dangling chain entry. Audit entries contain **metadata only**, never the sensitive payload; otherwise audit becomes a shadow copy of the data and erasure becomes impossible (ADR-016).

The Cloud stores hash-chained **snapshots** of the Admin's chain; comparing them detects divergence. The Cloud's own audit — including every owner action and every staff read of customer metadata — is chained the same way (ADR-013).

**Retention** (1 year / 5 years / forever) is the availability window for **Cloud-held audit snapshots**. The Admin's local chain is never deleted.

**Erasure** is crypto-shredding: destroy the resource's content key and its `blind_indexes` rows, record it in the permanent `erasure_ledger`, and re-apply that ledger on any restore. The ciphertext remains, the chain still verifies, the plaintext is unrecoverable. We never delete or rewrite `events` or `audit_entries`.

The corbeille lives in the Admin's `tombstones` table, quota-measured in serialized bytes; the Cloud holds deletion metadata only (ADR-016).

---

## 12. The Cloud Is An External Service To The Product

The product treats the Cloud as an opaque, versioned API. The product never:

- Imports Cloud source code
- Knows the Cloud's database schema
- Assumes the Cloud is online for normal project operation
- Hardcodes the Cloud's internal endpoints
- Holds credentials for the private channel

The product knows the public API contract, and that the Cloud handles auth, device registry, project registry, module signing, backup, audit, discovery and licensing.

**Project operation continues while the Cloud is offline**, because the Admin verifies Cloud-signed **membership certificates** locally and enforces its own role tables. Cloud sessions gate Cloud API calls only. See **ADR-012** — *ADR-009 is about Admin offline, a different case.* The licence grace window (ADR-014) is always shorter than certificate validity, so certificates never silently expire during an outage.

The Cloud is allowed to know nothing about business data. The product is allowed to know nothing about Cloud internals.

Within the Cloud, the **public channel** (`/v1/*`) and the **private channel** (`/ops/*`) are separate services. The private channel binds to the ops VPN interface only, requires staff hardware-key auth, and is never routed by the public listener (ADR-013). Customers have no route and no credentials — this is enforcement, not obscurity.

---

## 13. The App Is Hardened Against Bypass And Resource Exhaustion

Client binaries (Admin, User) are compiled with:

- Rust release profile: `strip = true`, `panic = "abort"`, `lto = true`, `codegen-units = 1`
- No debug symbols in production builds
- Platform code signing (Apple notarization, Windows Authenticode, Linux GPG)

**Resource limits:**

| Surface | Limit |
|---|---|
| Wasmtime CPU per invocation | 5 s |
| Wasmtime memory per instance | 64 MB (configurable) |
| Concurrent module instances | 4 per app |
| Command payload | 1 MB default |
| Sync frame | **16 MB** (larger payloads chunked) |
| Commands per device | 100 / s |
| Concurrent connections per User | 4 |
| Module UI bridge | 1 MB / message, 100 msg / s, 20 in-flight, 10 s timeout |
| Cloud API | 1000 req / min / account (tunable) |

**Three keepalives, named separately — never called "the heartbeat":**

| Name | Layer | Interval |
|---|---|---|
| WireGuard keep-alive | tunnel | 25 s |
| Admin session keepalive | WebSocket, User ↔ Admin | 30 s |
| Discovery heartbeat | HTTPS, device → Cloud | 60 s (max 1 / min / device) |

**Anti-bypass:**

- The User's command path checks Admin reachability before sending; no path bypasses it.
- The Admin's command handler is the only writer of business tables; `apply_event` is the only projection writer.
- Cloud signing keys live in a separate process (HSM in production); the main API cannot sign. The **patch key is separate again, offline, quorum-gated.**. The **app-updater key** is separate again, offline, quorum-gated (ADR-022).
- Entitlements are enforced by **what the Cloud will sign**, never by `if plan == X` in the client.
- The private channel is unreachable by customers: ops-VPN binding, staff hardware keys, public listener returns 404 for `/ops/*`.

**Anti-reverse-engineering, stated honestly:** binary stripping and signing, module content encrypted to the device key, capability-denied filesystem access, private keys held in the OS keychain (non-exportable where the platform allows). All of this **raises the bar substantially; it is not absolute DRM.** The client runs on the customer's machine, and a determined attacker with full control of a legitimately licensed device can read what that device can read. We say so in the docs and never claim otherwise in marketing.

Any request exceeding a limit is rejected and logged.

---

## 14. Data Is Never Held Hostage

The customer's data is always exportable, in open formats, without our permission and without the Cloud being online.

- The Admin can export any project, full fidelity (JSON + CSV, PDF for reports), at any time — on Plan 1, during a billing dispute, in grace, in read-only, in restricted mode, and after the bootstrap window lapses.
- Licence expiry or non-payment may make the app **read-only** (ADR-014). It never deletes, encrypts-away, or blocks export of existing data.
- Downgrades never delete: over-limit Users and projects become read-only; unlicensed modules are disabled but their tables are retained and exportable.
- A security deadline restricts writes; it never traps data (Principle 10).
- Zero-knowledge mode is offered honestly: we cannot recover what we cannot read (ADR-022).
- Backups, exports and the corbeille belong to the customer. **We are custodians, not owners.**

---

## Enforcement

These principles are not enforced by wishful thinking. They are enforced by:

- **Lint rules** (custom TS rules, `cargo deny`, custom Rust lints) — including: no User writes to business tables, no `DELETE` on `events`/`audit_entries`, no `VACUUM INTO`, no raw SQL from a network payload, no plan-id capability branches, no key derivation from a signing key, no bare virtual-IP APIs, no plaintext resource keys on the wire, no account-password Argon2 output used as key material
- **Type system** — branded IDs prevent identity confusion; capability types prevent permission leakage; signing and encryption keys are different types
- **CI checks** — architecture tests verify module boundaries, repo boundaries, `/ops/*` isolation, export availability in every billing state, and the platform table counts (**18 Admin / 6 User**, ADR-012)
- **Code review** — every PR reviewed against this document
- **ADR process** — the only way to break a rule is to write an ADR explaining why

If the code disagrees with this doc set, **the doc set wins** until an ADR supersedes it.

