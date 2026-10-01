# TASK ID: LAUNCH-028.1
# TITLE: Add: per-customer profile template
# STATUS: pending
# DEPENDENCIES: LAUNCH-027.2
# ALLOWED FILES: customers/_TEMPLATE.md
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
One file per customer. Private. Single source of truth for the team.

## REQUIRED IMPLEMENTATION

Create `customers/_TEMPLATE.md`:

```markdown
# Customer: {{company_name}}

**Created**: YYYY-MM-DD
**Status**: trial | active | churned | paused
**Plan**: starter | team | enterprise
**NPS**: ?
**Health**: 🟢 | 🟡 | 🔴
**Owner**: @name

## Contacts

- **Primary**: name, email, role, phone
- **Billing**: name, email
- **Technical**: name, email
- **Decision maker**: name, email

## Account

- Account ID: `acc_...`
- Project ID: `proj_...`
- Admin device: `dev_...` (last seen: ...)
- Users: N (M active)
- Storage: X GB
- Modules: list
- Last event: timestamp
- Last backup: timestamp

## History

### YYYY-MM-DD — note title

Detail here. Free-form.

## Key metrics

| Metric | Value | Trend |
|---|---|---|
| WAP | 5 | ↑ |
| Last event | 2 min ago | — |
| Last backup | 6 hours ago | ↑ |
| NPS last | 9 | — |

## Pain points

- (list)

## Open issues

- (list with ticket numbers)

## Notes

(Free-form. Anything you want the next teammate to know.)
```

## TESTS

```bash
cd /workspace
test -f customers/_TEMPLATE.md || { echo "FAIL"; exit 1; }
grep -q "Customer" customers/_TEMPLATE.md || { echo "FAIL"; exit 1; }
echo "OK"
```
