# Architecture Principles - 13 Non-Negotiable Rules

> **Status:** Locked
> **Audience:** every engineer, every AI agent, every code review

These are the rules that cannot be broken without an ADR. They are
enforced by code, lint rules, and code review.

---

## 1. One Owner Per Datum

Every piece of data has exactly one system that owns it. No dual ownership.
No "shared" tables. No implicit copies that pretend to be authoritative.

| Datum | Owner | Everyone else holds |
|---|---|---|
| Account identity | Cloud | nothing |
| Project identity | Cloud | nothing |
| Project business data | Admin | Users hold authorized projections only |
| User identity (account) | Cloud | Admin references by user_id |
| User membership | Cloud (metadata) + Admin (role + permissions) | - |
| Device identity | Cloud (public key) + Device (private key) | - |
| Module identity and signing | Cloud (signs) | Admin verifies, User verifies |
| Audit (business) | Admin | Cloud receives hash-chain snapshots |
| Audit (platform) | Cloud | - |
| Backup blobs | Cloud (encrypted storage) | Admin sends encrypted, Cloud cannot read |
| Backup encryption keys | Cloud (escrowed, wrapped) | Admin uses keys, Cloud stores wrapped copies |
| Soft-deleted records | Admin (data) + Cloud (metadata) | Held per plan quota |
| Device public IPs | Cloud (discovery) | Devices know their own |
| Sync data | Admin <-> User (direct) | Cloud never sees |

If you find yourself adding data to two systems and keeping them in sync,
you are doing it wrong. Pick the owner. The other holds a projection.

---

## 2. One Project = One Admin

A project has exactly one Admin device at any time. No co-admin, no
admin team. When the Admin device changes:

1. Old Admin device's public key is revoked by the Cloud.
2. New device generates a new keypair.
3. Recovery verification (current device OR recovery key) authorizes the new device.
4. New device becomes the sole authority.

Both devices may exist briefly during transition, but only one is ACTIVE.

---

## 3. Admin Offline = No Authoritative Writes

If the Admin is not available, the User cannot perform operations that
require Admin authority. The User app shows:

    ADMIN_ONLINE   - full operation
    ADMIN_OFFLINE  - read-only, no writes accepted
    ADMIN_UNKNOWN  - connection lost, status pending

The User app must NOT show "Success" for a write that has not been
accepted by the Admin. If Admin is unreachable, the write is rejected
with a clear error. There is no PENDING state in v1.

v1: no offline writes at all. (v2 may add a per-command offline queue for
selected low-risk operations, behind a feature flag.)

---

## 4. Events Live With Their Transaction

A business state change and the events that announce it must be committed
in the same database transaction. If the transaction rolls back, no event
exists. If it commits, the event is durable.

Correct:

    BEGIN
      UPDATE patients SET name = ? WHERE id = ?
      INSERT INTO outbox (event_type, payload) VALUES (?, ?)
      INSERT INTO audit_entries (...) VALUES (...)
    COMMIT
    -- Now, and only now, can we notify clients

Wrong:

    UPDATE patients ...
    send_to_user()   -- if this fails, DB has changed but clients don't know
    INSERT INTO outbox ...

This is the Transactional Outbox pattern. Non-negotiable.

---

## 5. Authorization Is Re-Checked At Every Boundary

A permission decision is valid only for the moment and context it was
made. If anything changes (permission revoked, role changed, project
state changed, session expired), the next operation is re-evaluated
from scratch.

Event delivery re-checks authorization at delivery time, not at event
creation. If User A's patient.read was revoked between event creation
and delivery, User A does not receive the event.

Roles exist so many users can share the same authorization. The
permission decision is based on the union of all roles the user holds
in the project, evaluated against the current roles table.

At delivery:

    if (!canRead(userA, event.resource, currentPermissions)) {
        dropEvent(userA, event.id, reason: "permission_revoked");
        continue;
    }
    sendEvent(userA, event);

---

## 6. Commands Are Idempotent

Every command carries an idempotency_key (UUIDv7 from the client). If
the same command is received twice (network retry, server crash
mid-process, client reconnect), the system processes it exactly once.

Implementation: store the idempotency_key with the resulting event.
Before executing, check if the key already exists. If yes, return the
previous result.

This makes the system safe against network failures without distributed
transactions.

---

## 7. Never Trust The Client

Admin app, User app, and any module running inside them are untrusted
from the Cloud's perspective. Even a fully-authenticated, fully-authorized
request is re-validated server-side:

- Is the device key valid? (Cloud checks its registry)
- Is the session fresh? (TTL + rotation)
- Is the project in the right state? (ACTIVE, not SUSPENDED, not DELETED)
- Is the actor authorized for this specific operation?

The server is the final gate.

Same inside the Admin: modules are untrusted. The Admin re-validates
every module call (capability check, table prefix isolation, command
authorization).

---

## 8. Modules Cannot Cross Borders

A module can only:

- Read its own declared tables
- Use the official Core API (commands, queries, events it declared)
- Receive data through the projection layer

A module cannot:

- Touch another module's tables
- Bypass the authorization layer
- Read or write the audit log
- Spawn processes outside the WASM sandbox
- Make network calls except through capability grants
- Access key escrow or Cloud signing keys

Enforced by:

- Capability-based WASI grants (declared in manifest)
- SQL-level table prefix isolation (each module gets mod_<name>_*)
- Lint rule: no db.execute outside the owning module
- Lint rule: no module imports a host function not in its manifest

---

## 9. Backups Are Encrypted Before They Leave, But Keys Are Escrowed

Admin encrypts the backup with a project-specific key before sending.
Cloud stores ciphertext AND a wrapped copy of the decryption key
(key escrow) for recovery.

Key hierarchy:

    Project Recovery Key (escrowed, wrapped with Cloud's key)
      Backup Encryption Key (per backup, rotated, escrowed)
      Database Encryption Key (local only, rotated)
      Outbound Sync Key (live sync to Users)
      Manual Backup Passphrase Key (per Plan 4, never escrowed)

Cloud can decrypt backups only during an authorized recovery event (with
customer verification). Every escrow access is logged and audited.

For Plan 4 manual backups, the customer can add a passphrase. The
passphrase-derived key is NEVER escrowed. If forgotten, the backup is
unrecoverable. By design.

---

## 10. Updates Are Atomic, Verified, Reversible - Including Data and Logic

Every update (core, app, module, data, schema, logic) follows the same
pipeline:

    1. Discover -> Download -> Verify Signature
    2. Backup (if modifying data) - snapshot + encrypt + store rollback copy
    3. Acquire project lock (no new commands, drain outbox)
    4. Apply in single transaction
    5. Verify (post-apply)
    6. Commit
    7. Broadcast to Users (if state-affecting)
    8. On any failure -> Rollback to previous version

Data updates and logic updates are first-class:

- Schema migration: forward-only DDL + data backfill in same tx
- Data patch: SQL DML with audit entry showing row counts
- Logic module: a Rust WASM module loaded into the hot-reload registry
- Security override: force-revoke, force-rotate, applied to open sessions

Cloud is authoritative for updates. Admin is the executor. This is the
live heart.

Critical updates have a deadline. If the Admin doesn't apply by the
deadline, the app refuses to start on next launch.

Non-critical updates are queued for 24h; the customer can inspect the
SQL before it runs and refuse (refusal is audited).

A failed update leaves the system in the same state as before. No
half-updated state.

---

## 11. Audit Is Append-Only And Tamper-Evident

Audit records are never updated or deleted in normal operation. They are
hash-chained: each entry includes prev_hash, so any tampering is
detectable.

Cloud stores hash-chained snapshots of the Admin's audit log (sent in
batches). Comparing the chain detects divergence. Cloud's own audit is
chained the same way.

User app does not write audit (no business meaning beyond the command log
on the Admin). If user-level audit becomes a regulatory requirement, it
goes through the Admin as a normal module feature.

Corbeille (soft-delete) is recorded in Cloud's audit. The corbeille
itself (the soft-deleted data) lives in the Admin's tombstones table.
Held per plan quota. When quota is reached, oldest is hard-deleted
(entering the 30-day recovery grace).

---

## 12. The Cloud Is An External Service To The Product

The product treats the Cloud as an opaque, versioned API. The product
never:

- Imports Cloud source code
- Knows the Cloud's database schema
- Assumes the Cloud is online for normal product operation
- Hardcodes Cloud's internal endpoints
- Has credentials for the private channel

The product knows:

- Cloud's public API contract (versioned, published as TS package)
- That Cloud handles auth, device registry, project registry, signing,
  backup, audit, discovery
- That product operations continue when Cloud is offline (with reduced
  functionality)

Within the Cloud, the public channel (/v1/*) and the private channel
(/ops/*) are separate services. The customer never sees the private
channel.

---

## 13. The App Is Hardened Against Reverse Engineering, Bypass, Resource Exhaustion

All client binaries (Admin, User) are compiled with:

- Rust release profile: strip = true, panic = "abort", lto = true,
  codegen-units = 1
- No debug symbols in production builds
- Platform-specific code signing (Apple notarization, Windows Authenticode,
  Linux GPG)

Module runtime enforces:

- Wasmtime CPU time budget: 5 seconds per invocation
- Wasmtime memory limit: 64 MB per module instance (configurable)
- Max concurrent module instances: 4 per app
- Input payload size limits (1 MB default)

Network and sync limits:

- Rate limit on sync requests per device (max 100 commands/sec)
- Max concurrent connections per User: 4
- Heartbeat every 60 seconds, not more than 1 per minute
- Discovery service rate limit: 1 heartbeat per minute per device
- Cloud API rate limit: 1000 requests/minute/account (tunable)

Anti-bypass:

- User app's command path checks Admin reachability before sending
- Admin's command handler is the only path that writes to business tables
- Cloud's signing key is in a separate process from the main API
- Customer cannot reach the private channel

Anti-reverse-engineering:

- Binary stripping + signing
- Wasmtime modules cannot dump state to file (capability denied)
- Customer cannot extract the device private key (OS keychain)
- Customer cannot extract the project encryption key without the device keychain key

Any request that exceeds these limits is rejected and logged.

---

## Enforcement

These principles are enforced by:

- Lint rules (ESLint custom rules, cargo deny, custom Rust lints)
- Type system (branded types prevent ID confusion)
- CI checks (architecture tests verify module boundaries)
- Code review (every PR against this doc)
- ADR process (only way to break a rule is to write an ADR)