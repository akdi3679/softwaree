# TASK ID: COMPLIANCE-001.3
# TITLE: Add compliance docs (HIPAA, GDPR, SOC2 mapping)
# STATUS: pending
# DEPENDENCIES: COMPLIANCE-001.2
# ALLOWED FILES: /workspace/docs/compliance/HIPAA.md, /workspace/docs/compliance/GDPR.md
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
Document how the platform meets each compliance framework.

## REQUIRED IMPLEMENTATION

Create `/workspace/docs/compliance/HIPAA.md`:

```markdown
# HIPAA compliance mapping

This document explains how the platform's design supports HIPAA Technical Safeguards (45 CFR 164.312) for medical-reception customers.

We are NOT certifying the platform as HIPAA-compliant — that's a customer responsibility. We document how the platform helps them meet their obligations.

## §164.312(a) Access Control

**Required**: Unique user identification, automatic logoff, encryption.

**How we help**:
- Unique user IDs (`usr_<22>`), one per human.
- Sessions are bounded (7-day TTL); the device key is regenerated on every install.
- All our mesh communication is encrypted (WireGuard).
- Cloud API requires HTTPS.

## §164.312(b) Audit Controls

**Required**: Hardware, software, procedural mechanisms to record and examine activity.

**How we help**:
- Every command produces an audit entry, hash-chained (Admin side).
- Cloud records its own audit log (separate).
- Audit retention: 6 years, automatic on the Cloud.
- Verification endpoint exposes the chain's integrity.

## §164.312(c) Integrity

**Required**: PHI must not be altered or destroyed in an unauthorized manner.

**How we help**:
- Events are append-only on the Admin. No UPDATE or DELETE on the events table.
- Audit log is hash-chained; tampering breaks the chain.
- Backups are signed (the Admin signs the backup before upload).
- Restoring a backup requires the device key + passphrase — even the Cloud can't fabricate one.

## §164.312(d) Authentication

**Required**: Person or entity seeking access is who they claim to be.

**How we help**:
- Passwords hashed with Argon2id (64MB memory, t=3, p=4).
- Sessions are 32-byte random tokens.
- Device key is required for sync.
- Rate limiting on auth endpoints (60/min/IP).

## §164.312(e) Transmission Security

**Required**: Integrity and confidentiality of transmitted PHI.

**How we help**:
- All sync traffic over our WireGuard mesh (WireGuard).
- Backup upload over HTTPS to MinIO.
- Hello message signed with device key.
- Frame validation on both ends.

## What the customer must do

- Sign a Business Associate Agreement (BAA) with us for the Cloud tier.
- Configure their Admin device with full disk encryption (FileVault / BitLocker / LUKS).
- Set a strong Admin passphrase.
- Enable our mesh ACLs to restrict who can connect.
- Train staff on phishing (the largest risk).
- Have their own incident response plan.

## What is NOT in scope

- Patient consent management (the customer's responsibility).
- Insurance billing (the customer's responsibility).
- Drug interaction checks (not part of the medical-reception module).
```

Create `/workspace/docs/compliance/GDPR.md`:

```markdown
# GDPR compliance mapping

How the platform supports GDPR compliance for EU customers.

## Article 5 — Principles

**Lawfulness, fairness, transparency**: Customer controls the data; we process only what they give us.
**Purpose limitation**: Data is used only for the platform's operation.
**Data minimization**: We don't collect data we don't need.
**Accuracy**: Customer controls updates.
**Storage limitation**: 6-year audit retention; otherwise data is per-project.
**Integrity & confidentiality**: Encryption in transit and at rest.

## Article 6 — Lawful basis

The platform processes data under:
- **Contract**: The customer has signed up for the service.
- **Legitimate interest**: Operating the platform (e.g., audit logs).

We do NOT rely on consent for service operation.

## Article 15 — Right of access

The customer can export all data via `POST /v1/accounts/:id/gdpr/export`.

## Article 17 — Right to erasure

The customer can delete their account via `POST /v1/accounts/:id/gdpr/delete`. User data within a project is purged via the Admin's `forget_user` command.

## Article 20 — Data portability

Same as Article 15: the export endpoint returns JSON.

## Article 25 — Data protection by design

Our design defaults:
- Local-first: data lives on the Admin's device, not in the Cloud.
- Encryption: backups are encrypted; the Cloud cannot read them.
- No third-party processors: we use Hetzner + MinIO + our own Cloud.
- Triple-signed modules: third-party code is sandboxed.

## Article 32 — Security of processing

- TLS 1.3 for all Cloud traffic.
- Argon2id password hashing.
- Device-bound sessions.
- our WireGuard mesh for all internal communication.
- Audit logs with hash chains.

## Article 33 — Breach notification

If we become aware of a breach, we notify affected customers within 72 hours. The breach response runbook is in `docs/runbooks/BREACH.md`.

## Data residency

- EU customers: Cloud runs in Hetzner FSN1 (Germany).
- US customers: Cloud runs in Hetzner HIL (Hillsboro, OR).
- APAC customers: Hetzner Singapore (added in Stage 3).

We do NOT replicate data across regions unless explicitly configured.

## DPO contact

dpo@product.local

## What is NOT in scope

- Cookie consent on the Admin/User Tauri apps (they don't use cookies).
- Marketing emails (we don't send any).
```

## TESTS

```bash
cd /workspace
test -f docs/compliance/HIPAA.md || { echo "FAIL"; exit 1; }
test -f docs/compliance/GDPR.md || { echo "FAIL: no GDPR"; exit 1; }
grep -q "HIPAA" docs/compliance/HIPAA.md || { echo "FAIL"; exit 1; }
grep -q "Article 17" docs/compliance/GDPR.md || { echo "FAIL: no Article 17"; exit 1; }
echo "OK"
```
