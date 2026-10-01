# TASK ID: COMPLIANCE-002.1
# TITLE: Add SOC 2 Type II readiness document
# STATUS: pending
# DEPENDENCIES: SCALABILITY-002.3
# ALLOWED FILES: /workspace/docs/compliance/SOC2.md
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Document SOC 2 Type II controls and how the platform supports them.

## REQUIRED IMPLEMENTATION

Create `/workspace/docs/compliance/SOC2.md`:

```markdown
# SOC 2 Type II readiness

This document maps the platform's controls to the SOC 2 Trust Services Criteria (TSC).

We are NOT certified as SOC 2 Type II — that's a customer responsibility. We document how the platform helps them meet their obligations.

## Common Criteria (CC)

### CC1 — Control environment

- Code of conduct documented (this repo)
- Org chart defined (team page on internal-infra)
- Background checks for employees (HR process)
- Quarterly security training (compliance tracker)

### CC2 — Communication

- Security advisories via GitHub releases
- Customer-facing changelog
- Status page at status.product.local
- Incident response runbook

### CC3 — Risk assessment

- Threat model document
- Annual risk assessment (compliance team's responsibility)
- Risk register (compliance team's tool)

### CC4 — Monitoring

- Prometheus + Grafana
- Alertmanager
- On-call rotation
- 24/7 alert response

### CC5 — Control activities

- Code review (all PRs require review)
- CI gates (lint, test, security)
- Change management (every change is a PR)
- Separation of duties (no one can merge their own code)

### CC6 — Logical and physical access

- Strong auth (Argon2id + our mesh device key)
- RBAC (per-project roles)
- Session management (7-day TTL, revocable)
- MFA support (TOTP)
- Network controls (our mesh ACLs)

### CC7 — System operations

- Daily backups (encrypted)
- Backup verification (weekly)
- DR runbook
- Capacity monitoring

### CC8 — Change management

- All changes via PR
- CI gates (lint, test, security, a11y)
- Manual review
- Canary release

### CC9 — Risk mitigation

- Insurance (cyber liability)
- Vendor management (subprocessor list)
- BCP (business continuity plan)

## Availability (A)

- Cloud has 99.9% SLA
- MinIO has 99.99% SLA (4+2 erasure coding)
- Backup retention 30 days
- DR RTO: 4h, RPO: 24h

## Confidentiality (C)

- All data encrypted in transit (TLS 1.3. Our WireGuard mesh)
- All data encrypted at rest (AES-256-GCM for backups)
- Access logged and audited

## Processing Integrity (PI)

- Event-sourced architecture (every change is an event)
- Hash-chained audit log
- Idempotent operations
- Transactional outbox

## Privacy (P)

- GDPR Article 17 (right to be forgotten) implemented
- Data export (Article 15)
- Data portability (Article 20)
- Privacy by design (no PII collected that we don't need)

## What is NOT in scope

- Customer's own SOC 2 audit (they must do this themselves)
- Penetration testing (we offer this as a service, separately)
- Vendor risk management for the customer's vendors (the customer's responsibility)
```

## TESTS

```bash
cd /workspace
test -f docs/compliance/SOC2.md || { echo "FAIL"; exit 1; }
grep -q "SOC 2" docs/compliance/SOC2.md || { echo "FAIL"; exit 1; }
echo "OK"
```
