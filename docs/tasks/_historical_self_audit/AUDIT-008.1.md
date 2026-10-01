# TASK ID: AUDIT-008.1
# TITLE: Self-audit fix #4: clarify Local plan (no Cloud account required)
# STATUS: pending
# DEPENDENCIES: AUDIT-007.2
# ALLOWED FILES: docs/architecture/05-FEATURES.md
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
The Local plan needs to be truly free and work without a Cloud account.
Otherwise "free" is misleading.

## WHY THIS WAS FOUND IN SELF-AUDIT
The original spec implied a Cloud account is always needed (for billing,
device activation, etc.). But the Local plan is $0 and should not need
any Cloud account — that's the whole point of "local-only".

## REQUIRED IMPLEMENTATION

Update `docs/architecture/05-FEATURES.md` — add a section under Plans:

```markdown
## Local plan: truly offline, no Cloud required

The Local plan is $0 **and** doesn't require a Cloud account.

### What works
- Download Admin
- Create one project
- Use any number of local-only modules
- Invite up to 0 users (single device only)
- Backups to local disk (customer chooses where)
- All data stays on the Admin computer
- No phone-home, no telemetry, no analytics

### What doesn't work
- No encrypted cloud backups
- No User app access (single device only)
- No device replacement (you're on your own)
- No automatic updates
- No support SLA (community forum only)
- No Stripe (no payment)

### How to upgrade
At any point, click "Activate Cloud" in Settings:
- Creates a Cloud account
- Migrates the project to Cloud (project key re-wrapped to Cloud)
- Cloud backups start
- User app support unlocks
- Customer is now on Starter (or higher)

### Licensing without an account
- Local plan = MIT license
- The Admin is a binary; we don't know it's running
- Updates: customer must re-download from our site
- This is intentional: zero phone-home

### Is this sustainable?
At $0, we make no money on Local. That's the point — it's a way to
try the product risk-free. We expect ~80% of Local users to upgrade
within 6 months (industry standard for "freemium to paid" funnels).
```

## TESTS

```bash
cd /workspace
test -f docs/architecture/05-FEATURES.md || { echo "FAIL"; exit 1; }
grep -q "Local plan" docs/architecture/05-FEATURES.md || { echo "FAIL"; exit 1; }
grep -q "no Cloud required" docs/architecture/05-FEATURES.md || { echo "FAIL"; exit 1; }
echo "OK"
```
