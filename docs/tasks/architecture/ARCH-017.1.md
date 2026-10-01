# TASK ID: ARCH-017.1
# TITLE: Add architecture: postmortem template
# STATUS: pending
# DEPENDENCIES: ARCH-016.2
# ALLOWED FILES: docs/templates/POSTMORTEM.md
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Template for SEV-1 / SEV-2 postmortems.

## REQUIRED IMPLEMENTATION

Create `docs/templates/POSTMORTEM.md`:

```markdown
# Postmortem: [TITLE]

**Date**: YYYY-MM-DD
**Severity**: SEV-1 | SEV-2 | SEV-3
**Duration**: HH:MM (from detection to mitigation)
**Author**: name
**Status**: Draft | Internal review | Published

## Summary

One paragraph: what happened, what was the impact, how we fixed it.

## Impact

- **Customers affected**: count or %
- **Data loss**: yes/no, scope
- **Service degradation**: which features
- **Revenue impact**: $X estimated
- **Reputation impact**: press coverage, social media

## Timeline (24h format, UTC)

- **T+0** (HH:MM): First signal (alert, customer report, internal)
- **T+X**: On-call paged
- **T+Y**: Investigation started
- **T+Z**: Root cause identified
- **T+W**: Mitigation deployed
- **T+V**: Full resolution
- **T+U**: Postmortem scheduled

## Root cause

Five whys:
1. Why did X happen? Because Y.
2. Why Y? Because Z.
3. Why Z? ...

## What went well

- Detection was fast (X minutes)
- On-call response was clear
- Communication was prompt

## What went poorly

- We didn't have a runbook for this scenario
- The fix took 2 deploys
- We didn't notify customers early enough

## Action items

Each with owner, due date, and tracking issue.

| # | Action | Owner | Due | Issue |
|---|---|---|---|---|
| 1 | Add X runbook | @name | 2026-XX-XX | #NNN |
| 2 | Improve alert Y | @name | 2026-XX-XX | #NNN |
| 3 | Document Z | @name | 2026-XX-XX | #NNN |

## Detection improvements

What alerts would have caught this earlier?

## Prevention

What code/config change would have prevented this?

## Lessons

What did we learn that applies to other systems?
```

## TESTS

```bash
cd /workspace
test -f docs/templates/POSTMORTEM.md || { echo "FAIL"; exit 1; }
grep -q "SEV-1" docs/templates/POSTMORTEM.md || { echo "FAIL"; exit 1; }
echo "OK"
```
