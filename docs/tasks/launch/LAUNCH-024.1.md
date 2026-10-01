# TASK ID: LAUNCH-024.1
# TITLE: Add: customer exit interview script
# STATUS: pending
# DEPENDENCIES: LAUNCH-023.2
# ALLOWED FILES: docs/runbooks/EXIT-INTERVIEW.md
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
When a customer leaves, learn why. Don't be defensive; just listen.

## REQUIRED IMPLEMENTATION

Create `docs/runbooks/EXIT-INTERVIEW.md`:

```markdown
# Customer Exit Interview

## Why

When a customer cancels, we want to know why. This is the most valuable
data we have. Don't be defensive. Don't argue. Just listen.

## When

Within 24 hours of cancellation. Email the customer, ask for 15 min.

## Script (15 min)

### Opening (2 min)
> "Hi [name], I saw you canceled. I'd love to understand what didn't
> work for you. There's no right answer — I'd genuinely like to learn
> so we can improve. Is that okay?"

### Probe (8 min)

Use open questions:

- What was the **main** reason you canceled?
- Was there a moment when you decided it wasn't for you?
- Did anything **almost** work but didn't quite?
- How did the **onboarding** feel? (Was anything confusing, missing, or slow?)
- How did the **support** feel? (Did you reach out? How long did we take?)
- Compared to other tools you tried, what did we **do well**?
- What would have to change for you to come back?
- On a scale of 1-10, how likely are you to recommend us to a friend?

### Closing (5 min)

- "Thank you, this is really helpful."
- "Within your rights, would you be open to me emailing you in 6 months
  when we've addressed [specific issue]?"
- "Is there anyone in your network who might benefit from Product?"

## After the call (within 24h)

- [ ] File the responses in `/lost-customers/{company}.md`
- [ ] If the issue is **fixable** (e.g., missing feature): add to roadmap
- [ ] If the issue is **us** (e.g., bad support): owner assigned, 30-day follow-up
- [ ] If the customer might come back: add to re-engagement list

## Sample re-engagement email (6 months later)

> Subject: Did we fix it?
> Hi [name], when you left you mentioned [specific issue]. We just
> shipped [fix/feature]. If you're still curious, here's a 30-day free trial:
> [link]. No pressure either way.

## Metrics to track

- Why are people leaving? (top 3 reasons)
- Which reasons are addressable vs not?
- Win-back rate (% of canceled who come back within 12 months)
- NPS at exit (vs NPS at start)
- Time between "started looking at alternatives" and "canceled"
```

## TESTS

```bash
cd /workspace
test -f docs/runbooks/EXIT-INTERVIEW.md || { echo "FAIL"; exit 1; }
grep -q "Exit" docs/runbooks/EXIT-INTERVIEW.md || { echo "FAIL"; exit 1; }
echo "OK"
```
