# TASK ID: SECURITY-001.5
# TITLE: Add threat model document
# STATUS: pending
# DEPENDENCIES: SECURITY-001.4
# ALLOWED FILES: /workspace/docs/security/THREAT-MODEL.md
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
Document the threat model — what we defend against, what we don't.

## REQUIRED IMPLEMENTATION

Create `/workspace/docs/security/THREAT-MODEL.md`:

```markdown
# Threat Model

This document enumerates the threats to the Product platform, the assets we protect, and the mitigations we have in place.

## Assets

| Asset | Where it lives | Sensitivity |
|------|----------------|-------------|
| Project data (events, audit, modules) | Admin device SQLite | HIGH — only project members + admin can see |
| User credentials (password hashes) | Cloud PostgreSQL | HIGH — Argon2id |
| Device keys (Ed25519 private keys) | Admin / User device | HIGH — file permission 0o600 |
| Backup blobs (encrypted SQLite) | Cloud MinIO | MEDIUM — encrypted, but ciphertext is opaque |
| Module binaries | Cloud MinIO + Admin disk | LOW — public, but must be signed |
| Audit logs | Admin SQLite (hash chained) | MEDIUM — must be tamper-evident |
| our mesh node keys | Local mesh daemon | HIGH |

## Threats

### T1: Account takeover
**Scenario**: Attacker steals user password and logs in.
**Mitigations**:
- Argon2id hashing (64MB, t=3, p=4) — slow to brute force
- Session tokens are 32 bytes random, opaque, 7-day TTL
- Sessions can be revoked by user
- Rate limiting on auth endpoints (60/min/IP)
- our mesh only; Cloud should not be exposed to public internet

**Residual risk**: Phishing. User must enter password into our app only.

### T2: Device theft
**Scenario**: Attacker steals Admin's laptop, takes it offline, attempts to extract data.
**Mitigations**:
- Full disk encryption (recommendation; out of scope for app)
- Device key file is 0o600
- Without the device key, the Admin cannot sign cloud_root challenges
- Backup blobs are encrypted with a key derived from device key + passphrase

**Residual risk**: If device is unlocked, attacker has full read access.

### T3: Man-in-the-middle on sync
**Scenario**: Attacker intercepts User → Admin traffic.
**Mitigations**:
- Our WireGuard mesh provides encryption in transit
- Hello message is signed with device key; receiver verifies
- App PIN / OS-level connection prompts on our WireGuard mesh

**Residual risk**: Compromised mesh node. Mitigated by mesh ACLs + per-device keypair + capability-based WASM.

### T4: Malicious module
**Scenario**: Attacker publishes a module that exfiltrates data.
**Mitigations**:
- Triple signature: cloud_root + project_license + device_bind
- Wasmtime sandbox: capability-based, no ambient I/O
- 64MB memory cap, 100k fuel
- WASI Preview 2: explicit capabilities only
- Modules run with no network access by default

**Residual risk**: Module author exploits Rust compiler bug. Mitigated by pinning toolchain.

### T5: Insider threat (cloud operator)
**Scenario**: Someone with DB access reads project data.
**Mitigations**:
- Cloud does NOT store business data. Cloud stores: accounts, devices, projects metadata, modules, audit of cloud actions, encrypted backups.
- Backups are encrypted with keys the Cloud does not have.
- Cloud audit log records every action.
- Cloud DB can be read-only replicated for investigators without write access.

**Residual risk**: If attacker can also run code on the Cloud, they can read all metadata.

### T6: Offline Admin writes
**Scenario**: Admin goes offline, modifies data, comes back online.
**Mitigations**: Not allowed in v1. v2: per-command OFFLINE_QUEUEABLE flag + CRDT or operational transform.

**Residual risk**: In v1, Admin must be online to accept writes. Users see stale data but read-only is OK.

### T7: Replay attack on sync
**Scenario**: Attacker captures and replays an old event.
**Mitigations**:
- Per-user cursor tracks last applied sequence; replays are idempotent
- Events include `occurred_at` timestamp + aggregate_version
- Event_id is unique (uuid v7)

**Residual risk**: If cursor is lost (DB corruption), full snapshot resync handles it.

### T8: Supply chain attack
**Scenario**: Attacker compromises a dependency.
**Mitigations**:
- Cargo dependencies pinned via lockfile, audited with `cargo audit`
- pnpm-lock.yaml checked in
- Container images built from official base, signed with cosign
- GitHub Actions pinned to SHA, not tag

**Residual risk**: Trust on first use of a dependency. New deps must be reviewed.

## Out of scope (v1)

- DOS protection at edge (rely on our WireGuard mesh + firewall)
- Mobile app (laptop + desktop only)
- Multi-Admin per project (forbidden by design)
- End-to-end encrypted chat between users
- E2E encrypted backups to third-party storage (we do encrypted backups to OUR MinIO only)

## Review

This document is reviewed:
- At every release
- When a new threat class is identified
- When a major design change is proposed
```

## TESTS

```bash
cd /workspace
test -f docs/security/THREAT-MODEL.md || { echo "FAIL"; exit 1; }
grep -q "Threat Model" docs/security/THREAT-MODEL.md || { echo "FAIL"; exit 1; }
grep -q "T1: Account takeover" docs/security/THREAT-MODEL.md || { echo "FAIL: no threats"; exit 1; }
echo "OK"
```
