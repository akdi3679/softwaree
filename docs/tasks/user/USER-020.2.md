# TASK ID: USER-020.2
# TITLE: Commit locale
# STATUS: pending
# DEPENDENCIES: USER-020.1
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
git commit -m "feat(user): add locale switcher (USER-020)"
```

## TESTS

```bash
cd /workspace/product
git log -1 --pretty=%s | grep -q "USER-020" || { echo "FAIL"; exit 1; }
echo "OK"
```
