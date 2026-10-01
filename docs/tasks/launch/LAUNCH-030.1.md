# TASK ID: LAUNCH-030.1
# TITLE: Add: SLA matrix & 24x7 on-call rotation doc
# STATUS: pending
# DEPENDENCIES: LAUNCH-029.2
# ALLOWED FILES: docs/operations/ON-CALL.md
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
The on-call rotation, who, when, how to escalate.

## REQUIRED IMPLEMENTATION

Create `docs/operations/ON-CALL.md`:

```markdown
# On-Call Rotation

## Why

The Cloud platform is 24x7. Customers in different time zones pay us
to be available. We need a human to be reachable at all times for SEV-1.

## Schedule

- Rotation: weekly, starting Monday 09:00 UTC
- Two people per shift:
  - **Primary** (first responder, owns the incident)
  - **Secondary** (backup if primary doesn't respond within 15 min)
- Hand-off: 30-minute overlap on Mondays (Mon 08:30-09:00 UTC)

## Who

Initial team:
- Week 1: @alice (primary), @bob (secondary)
- Week 2: @carol (primary), @dave (secondary)
- Week 3: @bob (primary), @alice (secondary)
- Week 4: @dave (primary), @carol (secondary)
- (Repeat)

Tool: PagerDuty auto-rotates; manually set up the schedule.

## Pager

- Primary: receives page after 5 min of an unresolved P1+ alert
- Secondary: receives page after 20 min if primary hasn't acknowledged
- Both get pages for SEV-1 immediately

## What to do

1. **Acknowledge** the page (click in PagerDuty)
2. Open the runbook: `docs/runbooks/CLOUD.md`
3. If you can't solve in 30 min, escalate to secondary
4. If SEV-1, post in Slack #incidents
5. After resolution, write a postmortem (within 48h)

## Compensation

- $200/week on-call retainer
- $100 per incident response (if paged)
- Time off the next week (comp)

## Out of hours

- Pages are only for SEV-1 and SEV-2
- SEV-3 waits until business hours (Mon-Fri 09:00-17:00 UTC)

## Bus factor

- Never have only one person on the rotation
- Always have a backup
- Document everything in runbooks (so anyone can pick up)
- Quarterly: practice a simulated incident
```

## TESTS

```bash
cd /workspace
test -f docs/operations/ON-CALL.md || { echo "FAIL"; exit 1; }
grep -q "On-Call" docs/operations/ON-CALL.md || { echo "FAIL"; exit 1; }
echo "OK"
```
