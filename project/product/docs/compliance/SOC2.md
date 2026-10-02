# SOC 2 Type II readiness

Maps platform controls to SOC 2 Trust Services Criteria.

## Common Criteria (CC)

### CC1 — Control environment
Code of conduct documented; org chart defined; background checks via HR; quarterly security training.

### CC2 — Communication
GitHub security advisories; customer changelog; status page; incident response runbook.

### CC3 — Risk assessment
Threat model document; annual risk assessment; risk register.

### CC4 — Monitoring
Prometheus + Grafana; Alertmanager; on-call rotation; 24/7 alert response.

### CC5 — Control activities
All PRs require review; CI gates (lint, test, security); every change is a PR; separation of duties.

### CC6 — Logical and physical access
Argon2id passwords; device-bound Ed25519 keys; per-project RBAC; 7-day session TTL; TOTP MFA; our mesh ACLs.

### CC7 — System operations
Daily encrypted backups; weekly backup verification; DR runbook; capacity monitoring.

### CC8 — Change management
All changes via PR; CI gates include a11y; manual review; canary release.

### CC9 — Risk mitigation
Cyber liability insurance; subprocessor list; business continuity plan.

## Availability (A)

- Cloud SLA 99.9%.
- MinIO 99.99% (4+2 erasure coding).
- Backup retention 30 days.
- DR RTO 4h, RPO 24h.

## Confidentiality (C)

- TLS 1.3 in transit; our WireGuard mesh internally.
- AES-256-GCM at rest for backups.
- Access logged and audited.

## Processing Integrity (PI)

- Event-sourced architecture.
- Hash-chained audit log.
- Idempotent operations.
- Transactional outbox.

## Privacy (P)

- GDPR Article 17 (right to erasure) implemented.
- Data export (Article 15) and portability (Article 20).
- Privacy by design.

## Out of scope

- Customer SOC 2 audit (customer responsibility).
- Penetration testing (offered separately).