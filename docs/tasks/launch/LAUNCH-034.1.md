# TASK ID: LAUNCH-034.1
# TITLE: Add: ship-it doc — what to do in the first 7 days
# STATUS: pending
# DEPENDENCIES: LAUNCH-033.2
# ALLOWED FILES: docs/launch/DAY-1-TO-7.md
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
The first 7 days after launch. What to watch, what to do, what to not panic about.

## REQUIRED IMPLEMENTATION

Create `docs/launch/DAY-1-TO-7.md`:

```markdown
# Launch: Day 1 to Day 7

## Day 1 (launch day)

### Hour 0 — Push the button
- [ ] Publish the blog post
- [ ] Post on socials (Twitter, LinkedIn, Reddit r/SelfHosted, Hacker News)
- [ ] Email the waitlist (if any)
- [ ] Activate the Stripe live mode
- [ ] Set status page to "All systems operational"
- [ ] All hands on deck in #launch channel

### Hour 1-4 — Watch the metrics
- [ ] Signups (target: 5-20)
- [ ] Signup → first project (target: >60%)
- [ ] First project → first backup (target: >80%)
- [ ] Errors in Sentry (target: <1% of sessions)
- [ ] Support emails (response within SLA)
- [ ] Twitter mentions

### Hour 4-24 — Triage
- [ ] Triage any support emails (within 1h for urgent)
- [ ] Triage any bug reports
- [ ] Post a "Day 1" update: "We launched, here's what happened"
- [ ] File any issues found during the day

## Day 2-3 — Listen

- [ ] Read every support email carefully
- [ ] Look for patterns: same complaint from 3+ customers = fix
- [ ] If anything is broken: hot-fix, don't wait
- [ ] Don't add new features yet. Just stabilize.

## Day 4-5 — First retrospective

- [ ] Gather the team
- [ ] What worked? What didn't?
- [ ] What surprised us?
- [ ] What's blocking customers from getting value?
- [ ] File the top 3 fixes for next week

## Day 6-7 — Communicate

- [ ] Send a "Week 1" update to customers
- [ ] Post on socials with stats (signups, WAP, NPS)
- [ ] Thank the team
- [ ] Plan next week

## What NOT to do in the first week

❌ Add new features (we have what we have; ship it)
❌ Change pricing
❌ Change terms of service
❌ Big marketing campaigns (we want organic)
❌ Speak at conferences (we want to focus)
❌ Hire anyone (see if we can sustain first)

## What to watch for

- **Cloud error rate** (alert at > 1%)
- **API latency p99** (alert at > 1s)
- **Backup success rate** (alert at < 99%)
- **New signups per day** (baseline)
- **Conversion to paid** (target: 8%)
- **Support tickets per customer** (target: < 1)
- **NPS** (target: > 40)
- **Twitter sentiment** (manual scan)

## When to panic

- Cloud is down for > 15 min
- Data loss reported by any customer
- A critical security issue
- A major competitor launches something similar

Otherwise: take a deep breath. We're fine.
```

## TESTS

```bash
cd /workspace
test -f docs/launch/DAY-1-TO-7.md || { echo "FAIL"; exit 1; }
grep -q "Day 1" docs/launch/DAY-1-TO-7.md || { echo "FAIL"; exit 1; }
echo "OK"
```
