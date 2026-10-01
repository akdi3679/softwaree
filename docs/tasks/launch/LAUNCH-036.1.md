# TASK ID: LAUNCH-036.1
# TITLE: Add: 30-day check-in template
# STATUS: pending
# DEPENDENCIES: LAUNCH-035.2
# ALLOWED FILES: docs/launch/30-DAY-CHECKIN.md
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
At the 30-day mark: are we succeeding? Standard questions.

## REQUIRED IMPLEMENTATION

Create `docs/launch/30-DAY-CHECKIN.md`:

```markdown
# 30-Day Check-in

## When
30 days after launch. Don't move it.

## Who
The whole team. 90 minutes.

## Agenda

### 30 min — Numbers
- Signups: total, daily, weekly trend
- Conversion: free → paid
- WAP (Weekly Active Projects)
- Churn: how many canceled
- NPS: 30-day pulse
- Support tickets: total, top 3 issues
- Cloud uptime
- Sync errors

### 30 min — What we learned
- Most loved feature
- Most hated friction
- Biggest surprise
- Worst bug

### 20 min — Decisions
- What we ship in the next 30 days
- What we explicitly do NOT ship
- Pricing changes?
- Marketing: what worked, what didn't
- Hiring: do we need anyone?

### 10 min — Team health
- Who's burned out?
- Who's bored?
- Who's growing?
- What rituals should we change?

## Output

- One-page summary, posted in #team
- Three priorities for next 30 days
- Two things to STOP doing
- One customer testimonial to share publicly

## What to NOT do

- Don't over-react to one data point
- Don't compare to others
- Don't start big initiatives
- Don't blame anyone

## After

- File the summary
- Send a "1 month in" update to customers
- Plan the next 30 days
- Take a day off (everyone, same day)
```

## TESTS

```bash
cd /workspace
test -f docs/launch/30-DAY-CHECKIN.md || { echo "FAIL"; exit 1; }
grep -q "30-day" docs/launch/30-DAY-CHECKIN.md || { echo "FAIL"; exit 1; }
echo "OK"
```
