# TASK ID: USER-009.3
# TITLE: Commit user attachments
# STATUS: pending
# DEPENDENCIES: USER-009.2
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
git commit -m "feat(user): add image attachments + gallery (USER-009)"
```

## TESTS

```bash
cd /workspace/product
git log -1 --pretty=%s | grep -q "USER-009" || { echo "FAIL"; exit 1; }
echo "OK"
```
