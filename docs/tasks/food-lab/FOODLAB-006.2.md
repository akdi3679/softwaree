# TASK ID: FOODLAB-006.2
# TITLE: Commit food-lab equipment
# STATUS: pending
# DEPENDENCIES: FOODLAB-006.1
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
git commit -m "feat(foodlab): add equipment tracking (FOODLAB-006)"
```

## TESTS

```bash
cd /workspace/product
git log -1 --pretty=%s | grep -q "FOODLAB-006" || { echo "FAIL"; exit 1; }
echo "OK"
```
