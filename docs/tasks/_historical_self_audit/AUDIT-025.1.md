# TASK ID: AUDIT-025.1
# TITLE: Self-audit fix #21: per-user pricing visibility
# STATUS: pending
# DEPENDENCIES: AUDIT-024.2
# ALLOWED FILES: docs/architecture/02-DECISIONS/ADR-015-pricing.md
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
The per-user add-on ($9/user) was added but not integrated clearly into
the plan matrix. Customers need to see "for my team of N users, I pay $X".

## WHY THIS WAS FOUND IN SELF-AUDIT
The pricing ADR lists $9/user add-on but doesn't show realistic
team-size scenarios. Customers want to know "what will I pay?".

## REQUIRED IMPLEMENTATION

Add to `docs/architecture/02-DECISIONS/ADR-015-pricing.md` (append):

```markdown
## Pricing examples by team size

| Team size | Best plan | Monthly cost | Annual cost (15% off) |
|---|---|---|---|
| 1 (just me) | Local | $0 | $0 |
| 1 (with backups) | Starter | $49 | $468/yr |
| 2-3 | Starter | $49 (up to 3 users) | $468/yr |
| 4-5 | Clinic | $149 | $1,428/yr |
| 6-10 | Clinic | $149 | $1,428/yr |
| 11 (need extra user) | Clinic + 1 add-on | $158 | $1,514/yr |
| 15 (5 extra users) | Clinic + 5 add-ons | $194 | $1,860/yr |
| 20 | Enterprise | $499+ | $4,788/yr |
| 50 | Enterprise (volume 30%) | $700 | $6,720/yr |

## What customers want to know

### "I'm a single doctor, will I use this?"
- Local: $0 forever
- Starter: $49/mo, you + 2 staff

### "I'm a clinic with 4 doctors + 6 staff = 10 users"
- Clinic: $149/mo covers 10 users, 3 projects

### "I'm a clinic with 4 doctors + 16 staff = 20 users"
- Clinic + 10 extra users = $149 + $90 = $239/mo
- OR Enterprise: $499/mo (unlimited users, dedicated support)

### "I'm a food lab with 8 staff"
- Clinic: $149/mo covers them all, daily backups

### "I'm a hospital with 50 users, multiple sites"
- Enterprise: $499-700/mo (volume discount)

## Why the $9/user add-on is important

- Customers don't want to upgrade just to add 1 user
- $9/user is the marginal cost (Cloud storage + bandwidth)
- Cheaper than per-user pricing on every plan
- Lets customers grow into a higher plan
- Same model as 1Password, Bitwarden, Notion

## Comparison to market

| Tool | 5 users | 10 users | 20 users |
|---|---|---|---|
| **Product (us)** | $49 (Starter) or $149 (Clinic) | $149 (Clinic) or $239 (Clinic + add-ons) | $239 (Clinic + 10) or $499 (Enterprise) |
| Linear | $40 | $80 | $160 |
| Notion | $40 | $80 | $160 |
| 1Password | $30 | $60 | $120 |
| Tebra (clinic) | $250+ | $500+ | $1000+ |

**Position**: more expensive than generic SaaS (because HIPAA, backups, local-first),
much cheaper than healthcare-specific (Tebra).
```

## TESTS

```bash
cd /workspace
test -f docs/architecture/02-DECISIONS/ADR-015-pricing.md || { echo "FAIL"; exit 1; }
grep -q "Pricing examples" docs/architecture/02-DECISIONS/ADR-015-pricing.md || { echo "FAIL"; exit 1; }
echo "OK"
```
