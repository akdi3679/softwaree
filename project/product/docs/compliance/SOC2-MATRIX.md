# SOC 2 Type II — Controls Matrix

Maps AICPA Trust Service Criteria to our implementation. Each control lists ID, description, implementation, test, frequency, owner.

## CC1 — Control Environment

### CC1.1 — Commitment to integrity
- **Description**: Employees sign a code of conduct.
- **Implementation**: HR records (not in codebase).
- **Test**: Manual review during audit.
- **Frequency**: Annual.

### CC1.4 — Background checks
- **Description**: Staff with production access pass background checks.
- **Implementation**: HR records.
- **Test**: Manual review.

## CC2 — Communication

### CC2.1 — Information quality
- **Description**: All events are recorded immutably.
- **Implementation**: apps/admin/src-tauri/src/events/store.rs (append-only events table).
- **Test**: AUDIT-003 hash-chain verification.
- **Frequency**: Continuous (every write).

## CC3 — Risk Assessment

### CC3.1 — Risk identification
- **Description**: Risk register maintained.
- **Implementation**: docs/security/THREAT-MODEL.md (T1-T8).
- **Test**: Quarterly review.
- **Frequency**: Quarterly.

## CC5 — Control Activities

### CC5.2 — System access controls
- **Description**: Only the Admin device of a project can write.
- **Implementation**: apps/admin/src-tauri/src/sync/hello_verify.rs.
- **Test**: SYNC-001 hello signature verification.
- **Frequency**: Every command.

## CC6 — Logical and Physical Access

### CC6.1 — Logical access controls
- **Description**: Auth tokens are device-bound Ed25519.
- **Implementation**: apps/admin/src-tauri/src/crypto/ + sync/validation.rs.
- **Test**: Admin commands verify signature on every request.
- **Frequency**: Every request.

### CC6.6 — Encryption at rest
- **Description**: Backups encrypted with AES-256-GCM + Argon2id + HKDF.
- **Implementation**: apps/admin/src-tauri/src/backup/crypto.rs.
- **Test**: BACKUP-001 encryption round-trip.
- **Frequency**: Every backup.

## CC7 — System Operations

### CC7.1 — Vulnerability management
- **Description**: cargo audit, pnpm audit, gitleaks in CI.
- **Implementation**: .github/workflows/audit.yml + secret-scan.yml.
- **Test**: CI must pass.
- **Frequency**: Every PR + weekly.

## CC8 — Change Management

### CC8.1 — Change approvals
- **Description**: All changes require PR review.
- **Implementation**: GitHub branch protection.
- **Test**: Manual review.
- **Frequency**: Every PR.

## CC9 — Risk Mitigation

### CC9.2 — Vendor management
- **Description**: Vendors listed and reviewed annually.
- **Implementation**: docs/compliance/VENDORS.md.
- **Test**: Annual review.

## Audit artifacts

Produced for SOC 2 audit:
1. audit-events.csv (last 12 months) — via AUDIT-002
2. access-log.jsonl — via AUDIT-002
3. chain-verify-report.json — via AUDIT-003
4. encryption-test-results.json — via BACKUP-001
5. ci-runs.csv — exported from GitHub Actions