# TASK ID: USER-021.2
# TITLE: Commit banner
# STATUS: pending
# DEPENDENCIES: USER-021.1
# ALLOWED FILES: product/.git/
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit.

## REQUIRED IMPLEMENTATION

```bash
cd /workspace/product
git add apps/user
git commit -m "feat(user): add patient banner (USER-021)"
```

## TESTS

```bash
cd /workspace/product
git log -1 --pretty=%s | grep -q "USER-021" || { echo "FAIL"; exit 1; }
echo "OK"
```
