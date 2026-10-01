# TASK ID: USER-008.3
# TITLE: Commit user extras
# STATUS: pending
# DEPENDENCIES: USER-008.2
# ALLOWED FILES: product/.git/
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit user extras.

## REQUIRED IMPLEMENTATION

```bash
cd /workspace/product
git add apps/user
git commit -m "feat(user): add accessibility settings + PDF export (USER-008)"
```

## TESTS

```bash
cd /workspace/product
git log -1 --pretty=%s | grep -q "USER-008" || { echo "FAIL"; exit 1; }
echo "OK"
```
