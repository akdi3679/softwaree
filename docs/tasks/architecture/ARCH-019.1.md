# TASK ID: ARCH-019.1
# TITLE: Add architecture: success metrics
# STATUS: pending
# DEPENDENCIES: ADMIN-055.2
# ALLOWED FILES: docs/architecture/METRICS.md
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
What we measure, why, and what we want.

## REQUIRED IMPLEMENTATION

Create `docs/architecture/METRICS.md`:

```markdown
# Success Metrics

## North Star

**Weekly Active Projects (WAP)**: a project is active if its Admin wrote
at least one event in the last 7 days.

## Leading indicators

| Metric | Target | Why |
|---|---|---|
| New signups / month | 50 | top of funnel |
| Signup → first project | > 60% | product fit |
| First project → first backup | > 80% | core value |
| Free → paid conversion | > 8% | monetization |
| Monthly churn | < 5% | retention |
| NPS | > 40 | satisfaction |
| Support tickets / customer / month | < 1 | self-serve |
| Time to first event | < 5 min | onboarding |
| Cold start time | < 1s | UX |
| Backup success rate | > 99% | reliability |
| Sync delivery p99 | < 5s | UX |

## Lagging indicators

- Monthly Recurring Revenue (MRR)
- Annual Recurring Revenue (ARR)
- Customer Lifetime Value (LTV)
- LTV / CAC ratio
- Net Revenue Retention (NRR)
- Gross margin (target: > 80%)

## How we measure

- **Signups**: Postgres query on `accounts.created_at`
- **Conversion**: Stripe webhooks
- **Churn**: Stripe cancellations + failed payments
- **NPS**: in-app survey at 30 days
- **Tickets**: support system
- **Performance**: client-side telemetry (opt-in)
- **Reliability**: Prometheus + our own uptime monitor

## What we don't measure

- DAU/MAU (we don't have users in the SaaS sense)
- Page views (no public website)
- Sign-up to paid (we have free → paid)
- Revenue per seat (we don't have seats)

## How we report

- Weekly to the team: WAP, MRR, new signups
- Monthly to investors: MRR, ARR, NRR, churn
- Quarterly: all metrics, plus customer interviews

## Goals (12-month)

- 100 paying customers
- $30K MRR
- < 5% monthly churn
- 50+ published modules
- 100+ active Users per paying project
```

## TESTS

```bash
cd /workspace
test -f docs/architecture/METRICS.md || { echo "FAIL"; exit 1; }
grep -q "WAP" docs/architecture/METRICS.md || { echo "FAIL"; exit 1; }
echo "OK"
```
