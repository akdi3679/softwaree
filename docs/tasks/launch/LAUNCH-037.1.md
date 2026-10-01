# TASK ID: LAUNCH-037.1
# TITLE: Add: v1.1 roadmap (post-launch)
# STATUS: pending
# DEPENDENCIES: LAUNCH-036.2
# ALLOWED FILES: docs/launch/V1.1-ROADMAP.md
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
What we ship in v1.1 (first 90 days after launch).

## REQUIRED IMPLEMENTATION

Create `docs/launch/V1.1-ROADMAP.md`:

```markdown
# v1.1 Roadmap (post-launch, first 90 days)

## Themes

1. **Customer feedback** — fix the top 3 reported issues
2. **Conversion** — make it easier to go free → paid
3. **Polish** — small improvements that feel like quality

## Specific items

### Customer feedback (commit to these from launch)
- [ ] Top 1 reported bug → fix + regression test
- [ ] Top 2 reported bug → fix + regression test
- [ ] Top 3 reported bug → fix + regression test
- [ ] Re-prioritize: anything mentioned in 3+ support emails

### Conversion
- [ ] In-app upgrade prompt when user hits plan limit
- [ ] 14-day free trial (instead of 7)
- [ ] Annual plan with 20% discount
- [ ] Better onboarding wizard (use real telemetry to find drop-offs)
- [ ] Email "first backup failed" with one-click fix

### Polish
- [ ] Loading skeletons (no more spinners)
- [ ] Empty states with illustrations + CTAs
- [ ] Better error messages
- [ ] Cmd-K everywhere
- [ ] Dark mode
- [ ] Mobile-friendly responsive UI for the portal
- [ ] Better keyboard navigation
- [ ] More languages (es, de, hi, zh, pt — already shipped in v1.0)

### Reliability
- [ ] Improve cold start to < 1s
- [ ] Improve sync latency p99 to < 5s
- [ ] Add more chaos tests
- [ ] Run pen-test, fix all findings
- [ ] Achieve SOC 2 Type I

### Marketing
- [ ] 3 customer case studies
- [ ] SEO content (5 long-form blog posts)
- [ ] Demo video (5 min)
- [ ] Live demo environment (read-only)

## What we WON'T do in v1.1

❌ Multi-Admin (v2, 2028)
❌ Offline writes (v2)
❌ Mobile native (v2)
❌ SSO/SAML (v2)
❌ Public API (v2)
❌ Big architecture changes

## Timeline

- Week 1-2: top 3 bugs
- Week 3-4: conversion improvements
- Week 5-8: polish
- Week 9-12: reliability + pen-test + SOC 2 prep
- Week 13: ship v1.1, start v1.2 planning
```

## TESTS

```bash
cd /workspace
test -f docs/launch/V1.1-ROADMAP.md || { echo "FAIL"; exit 1; }
grep -q "v1.1" docs/launch/V1.1-ROADMAP.md || { echo "FAIL"; exit 1; }
echo "OK"
```
