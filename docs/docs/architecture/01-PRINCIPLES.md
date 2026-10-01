# Architecture Principles — 13 Non-Negotiable Rules

> **Status:** Locked
> **Audience:** every engineer, every AI agent, every code review

These are the rules that **cannot be broken** without an ADR. They are not aspirational. They are enforced by code, lint rules, and code review.

---

## 1. One Owner Per Datum

Every piece of data has exactly one system that owns it. No dual ownership. No "shared" tables. No implicit copies that pretend to be authoritative.

| Datum | Owner | Everyone else holds |
|---|---|---|
| Account identity | Cloud | nothing |
| Project identity | Cloud | nothing |
| Project business data | Admin | Users hold authorized projections only |
| User identity (account) | Cloud | Admin references by `user_id` |
| User membership in project | Cloud (membership metadata) + Admin (role + permissions) | — |
| Device identity | Cloud (public key) + Device itself (private key) | — |
| Module identity & signing | Cloud (signs) | Admin verifies, User verifies |
| Audit (business) | Admin | Cloud receives hash-chain snapshots |
| Audit (platform) | Cloud | — |
| Backup blobs | Cloud (encrypted storage) | Admin sends encrypted, Cloud cannot read |
| Backup encryption keys | Cloud (escrowed, wrapped) | Admin uses keys, Cloud stores wrapped copies |
| Soft-deleted records (corbeille) | Admin (data) + Cloud (metadata) | Held per plan quota |
| Device public IPs (metadata) | Cloud (discovery) | Devices know their own |
| Sync data | Admin ↔ User (direct) | Cloud never sees |

**If you find yourself adding data to two systems and keeping them in sync, you are doing it wrong.** Pick the owner. The other holds a projection.

---

## 2. One Project = One Admin

A project has exactly one Admin device at any time. There is no "co-admin," no "admin team," no "two admins in different time zones." When the Admin device changes:

1. Old Admin device's public key is revoked by the Cloud.
2. New device generates a new keypair.
3. Recovery verification (current device OR recovery key) authorizes the new device.
4. New device becomes the sole authority.

Both old and new devices may exist briefly during transition, but only one is `ACTIVE` at a time. The Cloud is the single source of truth for "who is the Admin right now."

---

## 3. Admin Offline = No Authoritative Writes

If the Admin is not available, the User cannot perform any operation that requires Admin authority. The User app shows clearly:

- `ADMIN_ONLINE`  — full operation
- `ADMIN_OFFLINE` — read-only (cached data only), no writes accepted
- `ADMIN_UNKNOWN` — connection lost, status pending

The User app **must not** show "Success" for a write that has not been accepted by the Admin. If the Admin is unreachable, the write is rejected with a clear error. There is no `PENDING` state in v1.

In v1 we keep this strict: **no offline writes at all.** A write that cannot reach the Admin is rejected. (v2 may add a per-command offline queue for selected low-risk operations, behind a feature flag.)

---

## 4. Events Live With Their Transaction

A business state change and the events that announce it **must be committed in the same database transaction**. If the transaction rolls back, no event exists. If the transaction commits, the event is durable.

Correct:
```
BEGIN
  UPDATE patients SET name = ? WHERE id = ?
  INSERT INTO outbox (event_type, payload) VALUES (?, ?)
  INSERT INTO audit_entries (...) VALUES (...)
COMMIT
-- Now and only now can we notify clients
```

Wrong:
```
UPDATE patients ...
send_to_user()    -- if this fails, DB has changed but clients don't know
INSERT INTO outbox ...
```

This is the Transactional Outbox pattern. Non-negotiable.

---

## 5. Authorization Is Re-Checked At Every Boundary

A permission decision is valid only for the moment and context it was made. If anything changes (permission revoked, role changed, project state changed, session expired), the next operation is re-evaluated from scratch.

In particular, event delivery re-checks authorization at the time of delivery, not at the time the event was created. If User A's patient.read permission was revoked between event creation and delivery, User A does not receive the event.

Roles exist so that many users can share the same authorization. The permission decision is based on the **union of all roles** the user holds in the project, evaluated against the current roles table (not a cached snapshot).

At delivery time, before sending event to User A:
```
if (!canRead(userA, event.resource, currentPermissions)) {
    dropEvent(userA, event.id, reason: "permission_revoked");
    continue;
}
sendEvent(userA, event);
```

---

## 6. Commands Are Idempotent

Every command carries an `idempotency_key` (UUIDv7 from the client). If the same command is received twice (network retry, server crash mid-process, client reconnect), the system processes it exactly once.

Implementation: store the `idempotency_key` with the resulting event. Before executing, check if the key already exists in the recent window. If yes, return the previous result.

This is what makes the system safe against network failures without requiring distributed transactions.

---

## 7. Never Trust The Client

The Admin app, the User app, and any module running inside them are untrusted from the Cloud's perspective. Even a fully-authenticated, fully-authorized request is re-validated server-side:

- Is the device key valid? (Cloud checks against its registry)
- Is the session fresh? (TTL + rotation)
- Is the project in the right state? (ACTIVE, not SUSPENDED, not DELETED)
- Is the actor authorized for this specific operation? (not just "this role exists")

Defense in depth means: a buggy or malicious client cannot escalate its privileges by sending crafted payloads. The server is the final gate.

The same applies inside the Admin: modules are untrusted from the Admin's perspective. The Admin re-validates every module call (capability check, table prefix isolation, command authorization).

---

## 8. Modules Cannot Cross Borders

A module can only:

- Read its own declared tables
- Use the official Core API (commands, queries, events it declared in its manifest)
- Receive data through the projection layer (not raw table access)

A module cannot:

- Touch another module's tables
- Bypass the authorization layer
- Read or write the audit log
- Spawn processes outside the WASM sandbox
- Make network calls except through the explicit capability grant
- Access the project key escrow or the Cloud's signing keys

These rules are enforced by:

- Capability-based WASI grants (filesystem, network, clock — declared in manifest)
- SQL-level table prefix isolation (each module gets `mod_<name>_*`)
- Lint rule in the build: no `db.execute("SELECT * FROM mod_...")` outside the owning module
- A linter rule: no module can import a host function not declared in its manifest

---

## 9. Backups Are Encrypted Before They Leave, But Keys Are Escrowed For Recovery

The Admin encrypts the backup with a project-specific key before sending. The Cloud stores ciphertext AND a wrapped copy of the backup decryption key (key escrow) to enable recovery if the Admin device is lost.

Key hierarchy:

- Project Recovery Key (escrowed in Cloud, wrapped with Cloud's key)
  - Backup Encryption Key (per backup, rotated, escrowed with Cloud)
  - Database Encryption Key (local only, rotated)
  - Outbound Sync Key (used for live sync to Users)
  - Manual Backup Passphrase Key (per Plan 4 manual backup, never escrowed)

The Cloud can decrypt backups only during an authorized recovery event (with customer verification). Every key escrow access is logged and audited.

For Plan 4 manual backups, the customer can add a passphrase. The passphrase-derived key is **never escrowed** — if the customer forgets the passphrase, the backup is unrecoverable. This is by design.

If an Admin device is stolen, the thief needs the device's hardware-backed key to even mount the local database. The Cloud can help the legitimate Admin restore from backup after proving ownership.

---

## 10. Updates Are Atomic, Verified, And Reversible — Including Data and Logic Updates

Every update (core, app, module, **data, schema, logic**) follows the same pipeline:

1. Discover → Download → Verify Signature
2. Backup (if modifying data) — snapshot the project, encrypt, store rollback copy
3. Acquire project lock (no new commands, drain outbox)
4. Apply in single transaction
5. Verify (post-apply)
6. Commit
7. Broadcast to Users (if state-affecting)
8. If any step fails → Rollback to previous version

**Data updates and logic updates** are first-class update types, not bolt-ons:

- **Schema migration**: forward-only DDL, with data backfill in the same transaction
- **Data patch**: SQL DML with audit entry showing row counts
- **Logic module**: a Rust WASM module loaded into the hot-reload registry
- **Security override**: force-revoke, force-rotate, applied to all open sessions

The Cloud is **authoritative for updates**. The Admin is the executor. This is the "live heart" — updates can change logic and run specific SQL on all Admin devices.

Critical updates have a deadline. If the Admin does not apply by the deadline, the Admin app refuses to start on next launch. The only way to guarantee a security patch is applied.

Non-critical updates are queued for 24h; the customer can inspect the SQL before it runs and refuse (refusal is audited).

A failed update leaves the system in the same state as before. There is no "half-updated" state. If the update cannot be made safe, it does not ship.

---

## 11. Audit Is Append-Only And Tamper-Evident

Audit records are never updated or deleted in normal operation. They are hash-chained: each entry includes `prev_hash`, so any tampering is detectable.

The Cloud stores hash-chained snapshots of the Admin's audit log (sent in batches). Comparing the chain detects divergence. The Cloud's own audit is chained the same way and is queryable for compliance.

The User app does not write audit (no business meaning to user-level audit beyond the command log on the Admin). If user-level audit becomes a regulatory requirement, it goes through the Admin as a normal module feature.

The Corbeille (soft-delete) is recorded in the Cloud's audit. The Corbeille itself (the soft-deleted data) lives in the Admin's `tombstones` table. **Soft-deleted records are held per the plan's quota** (Plan 1: local only, Plan 2-4: held with quota). When the quota is reached, the oldest soft-deleted record is hard-deleted (entering the 30-day recovery grace).

---

## 12. The Cloud Is An External Service To The Product

The product (`product/`) treats the Cloud as an opaque, versioned API. The product never:

- Imports Cloud source code
- Knows the Cloud's database schema
- Assumes the Cloud is online for normal product operation
- Hardcodes the Cloud's internal endpoints
- Has credentials for the private channel

The product knows:

- The Cloud's public API contract (versioned, published as a TypeScript package)
- That the Cloud handles auth, device registry, project registry, module signing, backup, audit, discovery
- That product operations continue to work when the Cloud is offline (with reduced functionality — see ADR-009)

The Cloud is allowed to know nothing about business data. The product is allowed to know nothing about Cloud internals (except the public API contract).

Within the Cloud, the **public channel** (`/v1/*`) and the **private channel** (`/ops/*`) are separate services. The public channel serves customers (Admin, User). The private channel is reserved for the platform owner/developer and is used for: publishing new modules, pushing live-heart updates, ops actions, backup key escrow, telemetry. The customer never sees the private channel.

---

## 13. The App Is Hardened Against Reverse Engineering, Bypass, And Resource Exhaustion

All client binaries (Admin, User) are compiled with:

- Rust release profile: `strip = true`, `panic = "abort"`, `lto = true`, `codegen-units = 1`
- No debug symbols in production builds
- Platform-specific code signing (Apple notarization, Windows Authenticode, Linux GPG)

The module runtime enforces:

- Wasmtime CPU time budget: 5 seconds per invocation
- Wasmtime memory limit: 64 MB per module instance (configurable)
- Max concurrent module instances: 4 per app
- Input payload size limits for all commands (e.g., 1 MB default)

Network and sync resource limits:

- Rate limiting on sync requests per device (e.g., max 100 commands/sec)
- Max concurrent connections per User: 4
- Heartbeat every 60 seconds, but not more than 1 per minute
- Discovery service rate limit: 1 heartbeat per minute per device
- Cloud API rate limit: 1000 requests/minute/account (tunable)

Anti-bypass:

- The User app's command path checks Admin reachability before sending. No code path bypasses this.
- The Admin's command handler is the only path that can write to business tables. No direct SQL from User or Cloud.
- The Cloud's signing key is in a separate process from the main API. The main API cannot sign modules.
- The Customer cannot reach the private channel (no network route, no credentials).

Anti-reverse-engineering:

- Binary stripping + signing
- Wasmtime modules cannot dump their own state to a file (capability denied)
- The Customer cannot extract the device's private key (held in OS keychain)
- The Customer cannot extract the project's encryption key without the device's keychain key

The system must reject any request that exceeds these limits and log the event.

---

## Enforcement

These principles are not enforced by wishful thinking. They are enforced by:

- **Lint rules** (ESLint custom rules, cargo deny, custom Rust lints)
- **Type system** (branded types prevent ID confusion, capability types prevent permission leakage)
- **CI checks** (architecture tests verify module boundaries, dependency rules)
- **Code review** (every PR reviewed against this doc)
- **ADR process** (the only way to break a rule is to write an ADR explaining why)
