# TASK ID: FOODLAB-005.2
# TITLE: Commit food-lab reports
# STATUS: pending
# DEPENDENCIES: FOODLAB-005.1
# ALLOWED FILES: product/.git/
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit.

## REQUIRED IMPLEMENTATION

```bash
cd /workspace/product
git add apps/admin
git commit -m "feat(foodlab): add reports list UI (FOODLAB-005)"
```

## TESTS

```bash
cd /workspace/product
git log -1 --pretty=%s | grep -q "FOODLAB-005" || { echo "FAIL"; exit 1; }
echo "OK"
```
