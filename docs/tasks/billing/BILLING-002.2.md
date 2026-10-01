# TASK ID: BILLING-002.2
# TITLE: Commit billing proration
# STATUS: pending
# DEPENDENCIES: BILLING-002.1
# ALLOWED FILES: platform-cloud/.git/
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit.

## REQUIRED IMPLEMENTATION

```bash
cd /workspace/platform-cloud
git add src/billing
git commit -m "feat(billing): add plan change proration (BILLING-002)"
```

## TESTS

```bash
cd /workspace/platform-cloud
git log -1 --pretty=%s | grep -q "BILLING-002" || { echo "FAIL"; exit 1; }
echo "OK"
```
