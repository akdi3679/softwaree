# TASK ID: ARCH-013.1
# TITLE: Add architecture: SLA / SLO / SRE
# STATUS: pending
# DEPENDENCIES: CLOUD-018.2
# ALLOWED FILES: docs/architecture/SLA.md
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Service Level Agreement, Objectives, and Error budgets.

## REQUIRED IMPLEMENTATION

Create `docs/architecture/SLA.md`:

```markdown
# SLA / SLO / Error Budgets

## Uptime SLA (paid customers)

| Plan | SLA | Annual downtime allowed |
|---|---|---|
| Starter | 99.0% | 3 days, 15 hours |
| Team | 99.5% | 1 day, 19 hours |
| Enterprise | 99.9% | 8 hours, 46 minutes |

Uptime = successful HTTP responses to authenticated requests. Excludes:
- Scheduled maintenance (24h notice)
- Customer-side issues (offline Admin, broken network)
- Force majeure

We credit customers for missed SLA:
- < 99.0% — 10% of monthly fee
- < 95.0% — 50% of monthly fee
- < 90.0% — full month refund

## Service Level Objectives (internal)

- **API p99 latency** < 200ms (Cloud)
- **API p95 latency** < 100ms (Cloud)
- **API p50 latency** < 50ms (Cloud)
- **Backup success rate** > 99% over 30 days
- **Sync delivery (event applied on User)** < 5s p99

## Error budgets

A 99.9% SLO means 0.1% of requests can fail — that's ~43 minutes/month.

Process:
1. If we burn > 25% of the budget in a week: all non-critical releases are frozen
2. If we burn > 50%: deploys are frozen, only critical fixes
3. If we burn > 100%: full incident review; SLO is at risk

## Monitoring (SLI implementation)

- `slo_api_availability` = sum(rate(http_requests_total{status!~"5.."}[5m])) / sum(rate(http_requests_total[5m]))
- `slo_backup_success` = sum(rate(backup_success_total[30d])) / sum(rate(backup_attempt_total[30d]))
- `slo_sync_latency` = histogram_quantile(0.99, rate(sync_apply_duration_seconds_bucket[5m]))

## On-call

- Rotation: weekly
- Primary + Secondary
- Page after 5min of P2+ alerts unresolved
- Hand-off: 30min overlap on Mondays

## Incident management

- SEV-1: PagerDuty immediately
- SEV-2: Slack #incidents within 30min
- SEV-3: Daily standup review
- SEV-4: Backlog
```

## TESTS

```bash
cd /workspace
test -f docs/architecture/SLA.md || { echo "FAIL"; exit 1; }
grep -q "99.9" docs/architecture/SLA.md || { echo "FAIL"; exit 1; }
echo "OK"
```
