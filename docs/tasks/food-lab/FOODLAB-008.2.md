# TASK ID: FOODLAB-008.2
# TITLE: Commit food-lab clients
# STATUS: pending
# DEPENDENCIES: FOODLAB-008.1
# ALLOWED FILES: product/.git/
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit.

## REQUIRED IMPLEMENTATION

```bash
cd /workspace/product
git add modules/food-lab
git commit -m "feat(foodlab): add client management (FOODLAB-008)"
```

## TESTS

```bash
cd /workspace/product
git log -1 --pretty=%s | grep -q "FOODLAB-008" || { echo "FAIL"; exit 1; }
echo "OK"
```
