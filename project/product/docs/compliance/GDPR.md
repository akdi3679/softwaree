# GDPR compliance mapping

How the platform supports GDPR compliance for EU customers.

## Article 5 — Principles

- Lawfulness, fairness, transparency: customer controls the data.
- Purpose limitation: data used only for platform operation.
- Data minimization: we collect only what we need.
- Accuracy: customer controls updates.
- Storage limitation: 6-year audit retention; project data is per-project.
- Integrity and confidentiality: encryption in transit and at rest.

## Article 6 — Lawful basis

The platform processes data under:
- **Contract**: the customer signed up.
- **Legitimate interest**: operating the platform (audit logs).

We do NOT rely on consent for service operation.

## Article 15 — Right of access

POST /v1/accounts/:id/gdpr/export returns account, users, sessions.

## Article 17 — Right to erasure

- Account level: POST /v1/accounts/:id/gdpr/delete.
- User level within a project: Admin command forget_user (redacts events + audit, deletes user row).

## Article 20 — Data portability

Same as Article 15; JSON output.

## Article 25 — Data protection by design

- Local-first: data lives on the Admin device, not the Cloud.
- Encryption: backups encrypted; Cloud cannot read them.
- No third-party processors in the data path.
- Triple-signed modules: third-party code sandboxed.

## Article 32 — Security of processing

- TLS 1.3 for all Cloud traffic.
- Argon2id password hashing.
- Device-bound sessions.
- Our WireGuard mesh for internal comms.
- Hash-chained audit logs.

## Article 33 — Breach notification

If we become aware of a breach, notify affected customers within 72 hours. See docs/security/INCIDENT-RESPONSE.md.

## Data residency

- EU customers: Hetzner FSN1 (Germany).
- US customers: Hetzner HIL (Hillsboro, OR).
- APAC: Hetzner Singapore (added at Stage 3).

No cross-region replication unless explicitly configured.

## DPO contact

dpo@product.local

## Out of scope

- Cookie consent (Tauri apps don't use cookies).
- Marketing emails (we don't send any).