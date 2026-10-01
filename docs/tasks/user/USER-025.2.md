# TASK ID: USER-025.2
# TITLE: Commit resize
# STATUS: pending
# DEPENDENCIES: USER-025.1
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
git commit -m "feat(user): add resizable panel (USER-025)"
```

## TESTS

```bash
cd /workspace/product
git log -1 --pretty=%s | grep -q "USER-025" || { echo "FAIL"; exit 1; }
echo "OK"
```
