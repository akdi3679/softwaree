# Glossary - Shared Vocabulary

> **Status:** Active
> **Audience:** every engineer, every AI agent, every code review

Terms used across the codebase. When in doubt, use these definitions.

---

## A

**Admin.** The customer-facing desktop app that is the source of truth
for one project. Runs on Tauri. Owns all project business data.

**Admin device.** The physical device running the Admin app for a project.
A project has exactly one at any time.

**Aggregate.** A business entity that produces events (patient,
appointment, sample). Events reference aggregate_id and aggregate_version.

**Aggregate version.** A per-aggregate counter starting at 1. Used for
optimistic concurrency.

**ADR.** Architecture Decision Record. A short document describing a
decision, its context, and its consequences. Changing architecture
requires an ADR.

**Authority model.** The three-tier model: Cloud = platform authority,
Admin = project authority, User = no authority.

---

## B

**Backup blob.** Encrypted bytes uploaded by Admin, stored by Cloud in
MinIO. Cloud cannot decrypt without an authorized recovery event.

**Branded type.** A TypeScript type-level marker that prevents mixing
similar IDs (e.g. UserId cannot be used where ProjectId is expected).

---

## C

**Cloud.** The private control plane. Auth, device registry, project
registry, module signing, backup, audit, discovery. Never in the data
path for business operations.

**Command.** A request to change state. Has type, payload, idempotency
key. Two-phase handshake between User and Admin.

**Command envelope.** The wrapper around a command: id, type, actor,
correlation ID, idempotency key, timestamp.

**Corbeille.** Foreground soft-delete holding area on the Admin. Quota
per plan. Restorable. Oldest entries hard-deleted when quota is reached.

**Correlation ID.** A UUID that ties together all events/audit/logs
produced by one user request.

**Cursor.** The last sequence number a User has applied to its
projection. Per-table cursor exists for module-owned projection tables.

---

## D

**Discovery service.** A Cloud phone book: device public key -> last
public IP. Opt-out for privacy-paranoid customers.

**Drizzle.** The ORM. TypeScript-first, SQL-like, no codegen runtime.

---

## E

**Event.** An immutable record that something happened. Has sequence,
event_id, event_type, aggregate, payload. Never deleted (except by
Corbeille retirement).

**Event envelope.** The wrapper around an event: sequence, event_id,
type, aggregate, occurred_at, actor, payload, correlation, causation.

**Event store.** The append-only table events in the Admin DB.
Monotonic sequence.

---

## G

**Global sequence.** A single monotonic counter per project. Every event
increments it. Users track position by sequence.

---

## H

**Hash chain.** The audit log structure: each entry's entry_hash = sha256
of (prev_hash + fields). Tampering is detectable by walking the chain.

---

## I

**Idempotency key.** A UUIDv7 sent by the client with every command. The
Admin deduplicates by this key: same command received twice = processed
once.

---

## L

**Live heart.** The Cloud -> Admin update pipeline that can push schema
migrations, data patches, and logic changes, not just app binaries.

---

## M

**Module.** A WASM artifact (Rust -> wasm32-wasip2) that runs inside
Admin (full power) and User (restricted). Signed by the Cloud. Licensed
per project. Cannot escape its sandbox.

**Module manifest.** The metadata inside a module package: id, version,
required capabilities, provided commands/events/queries, signature.

---

## P

**Plan.** One of Local, Starter, Team, Enterprise. Controls user count,
backup storage, retention, custom modules.

**Projection.** The User's read-only local view of project data.
Rebuilt from events. The User writes nothing to it directly.

**Projection table.** A materialized read model on the User
(projection_patients, projection_samples, etc.).

---

## R

**Recovery key.** A key held offline by the customer that can authorize
a new Admin device if the original is lost.

**Replica.** A read-only Postgres copy used for scaling read traffic.
Not used until Stage 3.

---

## S

**Snapshot.** A compressed batch of events sent from Admin to User when
the User is too far behind to catch up incrementally.

**Soft-delete.** Moving a record to the Corbeille (tombstones table).
Not visible in normal queries. Restorable until retired.

**Sync.** The Admin <-> User direct protocol for exchanging events.
CBOR-encoded frames over WireGuard. Cloud never sees sync traffic.

---

## T

**Tauri.** The desktop shell. Rust backend + system WebView frontend.
5-15MB binaries. Capability-based security.

**Tenant.** A customer (organization). One tenant may have multiple
projects (Enterprise plan).

**Tombstone.** A record of a soft-deleted entity. Held in the Admin's
tombstones table.

**Transactional Outbox.** The pattern of writing state change + outbox
event in the same DB transaction. Non-negotiable.

---

## U

**User.** The customer-facing desktop app that holds a read-only
projection of its Admin's data. Cannot write authoritatively.

**UserId.** A branded type. Never confused with AccountId or DeviceId.

---

## V

**Virtual IP.** The stable 10.50.0.x address assigned to each device.
Never changes. Used by the mesh transport regardless of the actual
underlying IP.

---

## W

**Wasmtime.** The runtime that executes module WASM. Capability-based.
5s CPU budget, 64MB memory cap per invocation.

**WireGuard.** The E2E encryption layer for Admin <-> User sync. Kernel
module. No third-party VPN.

---

## Z

**Zod.** The runtime validation library used across the contracts
package, the Cloud API, and both apps.