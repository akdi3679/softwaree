# Threat Model

Assets, threats, and mitigations for the Product platform.

## Assets

| Asset | Where | Sensitivity |
|---|---|---|
| Project data | Admin SQLite | HIGH |
| User credentials (Argon2id) | Cloud Postgres | HIGH |
| Device keys (Ed25519) | Admin/User disk 0600 | HIGH |
| Backup blobs (encrypted) | Cloud MinIO | MEDIUM |
| Module binaries | Cloud MinIO + Admin disk | LOW (signed) |
| Audit log (hash chained) | Admin SQLite | MEDIUM |

## Threats

### T1: Account takeover
Mitigations: Argon2id, opaque session tokens with 7-day TTL, rate limited
auth endpoints, Cloud not exposed to public internet.

### T2: Device theft
Mitigations: device key 0600, no key -> no signing, backups encrypted with
a key derived from device key + passphrase.

### T3: Man-in-the-middle on sync
Mitigations: our WireGuard mesh (E2E), signed hello, mesh ACLs, capability-
based WASM.

### T4: Malicious module
Mitigations: triple signature (cloud_root + project_license + device_bind),
Wasmtime sandbox, 64MB memory cap, capability-based WASI, no network by
default.

### T5: Insider threat (cloud operator)
Mitigations: Cloud has no business data. Backups encrypted with keys the
Cloud does not have. Every Cloud action audited.

### T6: Offline Admin writes
Mitigations: not allowed in v1. User app shows read-only.

### T7: Replay attack
Mitigations: per-user cursor, unique event_id, aggregate_version checks.

### T8: Supply chain
Mitigations: Cargo.lock + pnpm-lock pinned, cargo-audit + pnpm-audit in CI,
base images signed.

## Out of scope (v1)

Edge DDoS, mobile, multi-Admin, E2E chat, third-party E2E storage.

## Review

Reviewed at every release, at new threat classes, at major design changes.
