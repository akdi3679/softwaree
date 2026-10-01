# TASK ID: USER-014.2
# TITLE: Commit favorites
# STATUS: pending
# DEPENDENCIES: USER-014.1
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
git commit -m "feat(user): add local favorites (USER-014)"
```

## TESTS

```bash
cd /workspace/product
git log -1 --pretty=%s | grep -q "USER-014" || { echo "FAIL"; exit 1; }
echo "OK"
```
