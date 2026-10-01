# TASK ID: FOODLAB-007.2
# TITLE: Commit food-lab methods
# STATUS: pending
# DEPENDENCIES: FOODLAB-007.1
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
git commit -m "feat(foodlab): add standard methods catalog (FOODLAB-007)"
```

## TESTS

```bash
cd /workspace/product
git log -1 --pretty=%s | grep -q "FOODLAB-007" || { echo "FAIL"; exit 1; }
echo "OK"
```
