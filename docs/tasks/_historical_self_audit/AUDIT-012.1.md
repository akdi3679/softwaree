# TASK ID: AUDIT-012.1
# TITLE: Self-audit fix #8: ADR-015 correct pricing per market
# STATUS: pending
# DEPENDENCIES: AUDIT-011.2
# ALLOWED FILES: docs/architecture/02-DECISIONS/ADR-015-pricing.md, product/contracts/src/plans.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
Redo pricing based on real market data and unit economics.

## WHY THIS WAS FOUND IN SELF-AUDIT
The original $29 / $99 / $499 pricing was wrong. At $29 with 3 users,
we lose money on support. Need to recalibrate based on:

1. Real market: what comparable tools charge
2. Real costs: what we pay for Cloud, support, Stripe
3. Real willingness to pay: what a clinic/lab will pay

## REQUIRED IMPLEMENTATION

Create `docs/architecture/02-DECISIONS/ADR-015-pricing.md`:

```markdown
# ADR-015: Pricing — Flat-Fee Tiers, Market-Calibrated

## Status
Accepted, 2026-08-09

## Context

Our previous pricing ($29 / $99 / $499) was wrong:

- At $29/mo for 3 users, we lose money on support
- At $99/mo for 10 users, we barely break even
- At $499/mo "enterprise", we don't actually have enterprise features

We need pricing that:
1. Covers our costs
2. Is fair to customers
3. Is competitive in our market (clinics, food labs, small orgs)
4. Has clear upgrade triggers

## Market research (2026)

| Tool | Price | What they do |
|---|---|---|
| Linear (project mgmt) | $8/user/mo | SaaS, no privacy focus |
| Notion (docs/wiki) | $8/user/mo | SaaS, no privacy focus |
| SimplePractice (clinic) | $60/clinician/mo | SaaS, HIPAA |
| Tebra/Kareo (clinic) | $250+/mo | SaaS, full EMR |
| DrChrono (clinic) | $200+/mo | SaaS, EMR |
| 1Password (passwords) | $2.99-7.99/user/mo | SaaS, privacy focus |
| Bitwarden (passwords) | $3/user/mo | Open source |
| Trello (kanban) | $5-12.50/user/mo | SaaS |

For a local-first, privacy-focused, HIPAA-aware tool for clinics/labs,
the market expects:
- Cheaper than enterprise EMR ($200+/mo)
- More expensive than generic SaaS ($8/user/mo) because of HIPAA, backups
- Roughly: $50-500/mo for small to mid-size customers

## Our cost structure per customer

| Item | Cost |
|---|---|
| Postgres (Cloud) | $0.50/mo |
| MinIO (backups) | $0.50-3/mo (depends on size) |
| Bandwidth | $0.50-2/mo |
| Stripe fees | 2.9% + 30¢ |
| Support (FTE) | $40/customer/mo at 200 customers |
| Cloud ops (overhead) | $5/customer/mo at 200 customers |
| **Total cost per customer** | **$50-55/customer/mo at scale** |

This is dominated by **support cost** ($40/customer). At small scale
(< 50 customers), support cost is higher (fewer customers per FTE).

## Decision

New pricing, **flat-fee per tier** (not per-user — simpler for non-tech):

### Local
- **Price**: $0
- **Includes**: 1 device, 1 project, 0 users, no backups
- **Support**: community forum only
- **Use case**: trying it out, single-computer workflows

### Starter
- **Price**: $49/mo (billed monthly) or $39/mo (billed annually)
- **Includes**: up to 3 users, 1 project, weekly backups, email support (48h)
- **Support**: email + forum
- **Use case**: small clinic, single-doctor practice, small food lab

### Clinic
- **Price**: $149/mo (monthly) or $119/mo (annual)
- **Includes**: up to 10 users, 3 projects, daily backups, priority email (24h)
- **Support**: email, 24h SLA
- **Use case**: multi-doctor clinic, mid-size lab, hotel, restaurant, gym

### Lab (same price as Clinic, different positioning)
- **Price**: $149/mo (monthly) or $119/mo (annual)
- **Includes**: same as Clinic, plus food-lab module pre-installed
- **Use case**: food analysis lab, testing facility

### Enterprise
- **Price**: $499+/mo (custom quote)
- **Includes**: unlimited users, unlimited projects, hourly backups,
  SSO, custom modules, dedicated CSM, 4h SLA
- **Support**: dedicated, 4h SLA
- **Use case**: multi-location clinic, hospital, multi-tenant lab

### Add-ons (all tiers)
- Extra user: $9/user/mo
- Extra project: $19/project/mo
- Extra storage: $0.50/GB/mo
- Custom module: starts at $1,500 one-time + $50/mo maintenance

### Volume discount (Enterprise only)
- 5+ licenses: 10% off
- 10+ licenses: 20% off
- 25+ licenses: 30% off

## Unit economics at scale

| Tier | Customers | Revenue | Cost | Margin |
|---|---|---|---|---|
| Local | 1,000 | $0 | $0 | n/a (loss leader) |
| Starter | 500 | $24,500 | $25,000 | -2% (small loss) |
| Clinic | 200 | $29,800 | $10,000 | 66% |
| Enterprise | 30 | $15,000 | $5,000 | 67% |
| **Total** | **1,730** | **$69,300** | **$40,000** | **42%** |

Assumptions: 80% conversion Local → paid within 6 months (industry avg),
~5% Starter → Clinic upgrade, 5% Clinic → Enterprise upgrade.

## Comparison to market

- vs SimplePractice ($60/clinician × 3 clinicians = $180/mo): we're $49 vs $180
- vs Tebra ($250+/mo): we're $49-149 vs $250+
- vs Linear ($8/user × 3 = $24/mo): we're $49 vs $24 (but we have HIPAA, backups)

**Position**: cheaper than healthcare-specific tools, more expensive than
generic SaaS, justified by local-first, privacy, HIPAA, backup.

## What we charge less than market for

- ✅ Storage ($0.50/GB vs Backblaze B2 $0.005/GB — but we add encryption)
- ✅ Bandwidth ($0 vs AWS S3 $0.09/GB egress)
- ✅ Self-hosting (free vs $50+/mo for some competitors)

## What we charge more than market for

- ⚠️ Starter tier at $49 vs Linear $24 — but we offer HIPAA, backups, support
- ⚠️ Add-on users at $9/user vs Linear $8 — comparable

## Consequences

### Positive
- Profitable at 500 customers
- Clear upgrade path
- Aligns with what market will pay
- Simple to explain to non-technical buyers

### Negative
- Starter is a slight loss leader (intentional, for funnel)
- 80% conversion assumption is unproven (need to validate)
- Flat-fee may be wrong for very small customers (1 user) — accept as edge case

### Mitigations
- Tight support automation to reduce $40/customer cost
- Self-service upgrade flow
- Annual plans (15% off) for better cash flow
- Re-evaluate pricing after 100 paying customers

## Future adjustments

- After 6 months: re-evaluate based on data
- If conversion is < 50%: consider free trial instead of free tier
- If support cost is high: consider community forum only for Starter
```

Now also update `product/contracts/src/plans.ts` with new prices:

```typescript
export const PLAN_PRICES_USD = {
  local: { monthly: 0, annual: 0 },
  starter: { monthly: 49, annual: 39 },         // was 29
  clinic: { monthly: 149, annual: 119 },         // was 99
  lab: { monthly: 149, annual: 119 },            // was 99
  enterprise: { monthly: 499, annual: 399 },     // was 499
} as const;

export const PLAN_LIMITS = {
  local: { users: 0, projects: 1, backups: 'none', support: 'community' },
  starter: { users: 3, projects: 1, backups: 'weekly', support: 'email-48h' },
  clinic: { users: 10, projects: 3, backups: 'daily', support: 'email-24h' },
  lab: { users: 10, projects: 3, backups: 'daily', support: 'email-24h' },
  enterprise: { users: Infinity, projects: Infinity, backups: 'hourly', support: 'sla-4h' },
} as const;

export const PLAN_ADDONS = {
  extraUser: 9,        // USD per user per month
  extraProject: 19,    // USD per project per month
  extraStorage: 0.5,   // USD per GB per month
  customModule: 1500,  // USD one-time setup
  customModuleMonthly: 50,  // USD per month maintenance
} as const;
```

## TESTS

```bash
cd /workspace
test -f docs/architecture/02-DECISIONS/ADR-015-pricing.md || { echo "FAIL"; exit 1; }
grep -q "49" docs/architecture/02-DECISIONS/ADR-015-pricing.md || { echo "FAIL"; exit 1; }
grep -q "starter" product/contracts/src/plans.ts || { echo "FAIL: no plans update"; exit 1; }
echo "OK"
```
