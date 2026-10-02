# HIPAA compliance mapping

How the platform supports HIPAA Technical Safeguards (45 CFR 164.312) for medical-reception customers.

We do NOT certify the platform as HIPAA-compliant — that is the customer responsibility. This documents how the platform helps them meet their obligations.

## 164.312(a) Access Control

**Required**: Unique user identification, automatic logoff, encryption.

**How we help**:
- Unique user IDs (usr_<22>), one per human.
- Sessions bounded (7-day TTL); device key regenerated on every install.
- Sync traffic encrypted (our WireGuard mesh).
- Cloud API requires HTTPS.

## 164.312(b) Audit Controls

**Required**: Record and examine activity.

**How we help**:
- Every command produces an audit entry, hash-chained (Admin side).
- Cloud records its own audit log.
- Audit retention 6 years automatic.
- verifyChain() exposes integrity.

## 164.312(c) Integrity

**Required**: PHI must not be altered or destroyed in an unauthorized manner.

**How we help**:
- Events append-only on the Admin.
- Audit hash-chained; tampering breaks the chain.
- Backups signed by Admin before upload.
- Restoring a backup requires device key + passphrase.

## 164.312(d) Authentication

**Required**: Person seeking access is who they claim to be.

**How we help**:
- Argon2id password hashing (64 MB, t=3, p=4).
- 32-byte random session tokens.
- Device key required for sync.
- Rate limiting on auth endpoints.

## 164.312(e) Transmission Security

**Required**: Integrity and confidentiality of transmitted PHI.

**How we help**:
- All sync traffic over our WireGuard mesh.
- Backup upload over HTTPS.
- Hello signed with device key.
- Frame validation on both ends.

## Customer responsibilities

- Sign a Business Associate Agreement (BAA) for the Cloud tier.
- Enable full disk encryption (FileVault / BitLocker / LUKS).
- Set a strong Admin passphrase.
- Train staff on phishing.
- Maintain their own incident response plan.

## Out of scope

- Patient consent management.
- Insurance billing.
- Drug interaction checks.