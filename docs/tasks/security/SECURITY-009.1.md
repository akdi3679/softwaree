# TASK ID: SECURITY-009.1
# TITLE: Add security: incident response plan
# STATUS: pending
# DEPENDENCIES: ADMIN-029.2
# ALLOWED FILES: docs/security/INCIDENT-RESPONSE.md
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
What to do in the first 24h of a security incident.

## REQUIRED IMPLEMENTATION

Create `docs/security/INCIDENT-RESPONSE.md`:

```markdown
# Incident Response Plan

## Severity levels

- **SEV-1**: Active breach; customer data exfiltrated or in danger.
- **SEV-2**: Vulnerability disclosed; patch needed; not yet exploited.
- **SEV-3**: Minor issue; fix in next release.

## First 24h playbook (SEV-1)

### 0-15 min: Detect & contain
- [ ] Page on-call: `#incidents` Slack channel
- [ ] Identify affected systems (grep logs, ask Cloud)
- [ ] If active: rotate secrets NOW
  - Stripe webhook secret
  - JWT signing keys
  - DB passwords
  - our mesh ACL key
  - Infisical token
- [ ] Suspend affected Cloud account (preserves data, blocks new sessions)

### 15-60 min: Assess
- [ ] Pull all audit logs for the affected project
- [ ] Hash and timestamp the logs (evidence preservation)
- [ ] Determine scope: how many customers, what data
- [ ] If PII: identify which customers

### 1-4h: Notify
- [ ] Notify affected customers (use the support email template)
- [ ] Notify relevant authorities (GDPR: 72h; HIPAA: 60 days)
- [ ] If payment data: notify Stripe (they have a fraud team)
- [ ] Post public status page update

### 4-24h: Recover
- [ ] Apply patches / revoke compromised credentials
- [ ] Re-enable affected accounts (after user reset)
- [ ] Verify chain integrity (all hash chains still verify)
- [ ] Write post-mortem
- [ ] Schedule customer briefing

## Communication templates

### Customer notification (initial)
> Dear [Customer],
> We are writing to inform you of a security incident that may have affected
> your account on [date]. [Plain-English description of what happened, what
> data was involved, what we're doing, what they should do].
> We're available 24/7 at [contact]. We'll update you within 72 hours.

### Public status page
> Investigating: We are aware of an issue affecting [scope]. Customer data
> is not at risk at this time. Updates every 30 minutes.

### Post-mortem (published 7 days later)
> On [date], a vulnerability in [component] allowed [attacker action]. We
> [what we did]. Customer impact: [scope]. We have since [fixes]. We
> apologize and are committed to [prevention].

## Team contacts

- CEO: +XX-XXXX
- CTO: +XX-XXXX
- Lead Ops: +XX-XXXX
- Legal: +XX-XXXX
- Stripe account manager: [name]

## Tools

- Slack: `#incidents` (private)
- Status page: https://status.example.com
- Customer email: support@example.com
- Press contact: press@example.com
- PagerDuty: product-oncall

## Lessons learned

Every SEV-1 must produce:
1. Post-mortem doc (no blame; facts + actions)
2. 5-whys root cause
3. Three action items, each with owner + due date
4. Follow-up in 30 days to verify action items
```

## TESTS

```bash
cd /workspace
test -f docs/security/INCIDENT-RESPONSE.md || { echo "FAIL"; exit 1; }
grep -q "SEV-1" docs/security/INCIDENT-RESPONSE.md || { echo "FAIL"; exit 1; }
echo "OK"
```
