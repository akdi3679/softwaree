# On-Call Rotation

## Why

The Cloud platform is 24x7. Customers in different time zones pay us to be available. We need a human reachable at all times for SEV-1.

## Schedule

- Rotation: weekly, starting Monday 09:00 UTC
- Two people per shift:
  - Primary: first responder, owns the incident
  - Secondary: backup if primary does not respond within 15 min
- Hand-off: 30-minute overlap on Mondays (08:30-09:00 UTC)

## Who

Initial team rotation (4 people):
- Week 1: Alice (primary), Bob (secondary)
- Week 2: Carol (primary), Dave (secondary)
- Week 3: Bob (primary), Alice (secondary)
- Week 4: Dave (primary), Carol (secondary)
- Repeat

Tool: PagerDuty auto-rotates.

## Pager

- Primary: receives page after 5 min of an unresolved P1+ alert
- Secondary: receives page after 20 min if primary has not acknowledged
- Both get pages for SEV-1 immediately

## What to do

1. Acknowledge the page (click in PagerDuty)
2. Open the runbook: docs/runbooks/CLOUD.md
3. If you cannot solve in 30 min, escalate to secondary
4. If SEV-1, post in Slack #incidents
5. After resolution, write a postmortem (within 48h)

## Compensation

- $200/week on-call retainer
- $100 per incident response (if paged)
- Comp time the next week

## Out of hours

- Pages are only for SEV-1 and SEV-2
- SEV-3 waits until business hours (Mon-Fri 09:00-17:00 UTC)

## Bus factor

- Never have only one person on the rotation
- Always have a backup
- Document everything in runbooks
- Quarterly: practice a simulated incident