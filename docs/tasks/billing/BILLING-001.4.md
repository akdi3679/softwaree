# TASK ID: BILLING-001.4
# TITLE: Commit billing foundation
# STATUS: pending
# DEPENDENCIES: BILLING-001.3
# ALLOWED FILES: product/.git/, platform-cloud/.git/
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit billing.

## REQUIRED IMPLEMENTATION

```bash
cd /workspace/platform-cloud
git add src/billing
git commit -m "feat(billing): add Stripe integration + routes (BILLING-001)"

cd /workspace/product
git add apps/admin/src-tauri/src/billing
git commit -m "feat(billing): add plan enforcement on Admin (BILLING-001)"
```

## TESTS

```bash
cd /workspace/platform-cloud
git log -1 --pretty=%s | grep -q "BILLING-001" || { echo "FAIL"; exit 1; }
echo "OK"
```
