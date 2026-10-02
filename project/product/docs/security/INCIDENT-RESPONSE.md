# Incident Response Plan

## Severity levels

- SEV-1: Active breach, customer data at risk
- SEV-2: Vulnerability disclosed, patch needed, not yet exploited
- SEV-3: Minor issue, fix in next release

## First 24h playbook (SEV-1)

### 0-15 min: Detect and contain
- Page on-call in #incidents
- Identify affected systems
- Rotate secrets: Stripe webhook, JWT signing, DB passwords, mesh ACL key
- Suspend affected Cloud account

### 15-60 min: Assess
- Pull audit logs for affected project
- Hash and timestamp logs (evidence)
- Determine scope: how many customers, what data

### 1-4h: Notify
- Notify affected customers
- Notify authorities (GDPR: 72h; HIPAA: 60 days)
- Notify Stripe if payment data involved
- Status page update

### 4-24h: Recover
- Apply patches
- Revoke compromised credentials
- Verify chain integrity
- Write post-mortem

## Communication templates

Customer notification, public status page, and post-mortem (published 7
days after resolution). See the full text in the source task file.

## Team contacts

CEO, CTO, Lead Ops, Legal, Stripe account manager (populate before launch).

## Lessons learned

Every SEV-1 requires: post-mortem doc, 5-whys root cause, three action items
with owners and due dates, and a 30-day follow-up.
