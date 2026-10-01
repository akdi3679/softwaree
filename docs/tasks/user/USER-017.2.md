# TASK ID: USER-017.2
# TITLE: Commit user dashboard
# STATUS: pending
# DEPENDENCIES: USER-017.1
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
git commit -m "feat(user): add dashboard stats (USER-017)"
```

## TESTS

```bash
cd /workspace/product
git log -1 --pretty=%s | grep -q "USER-017" || { echo "FAIL"; exit 1; }
echo "OK"
```
