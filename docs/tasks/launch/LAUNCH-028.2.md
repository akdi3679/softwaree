# TASK ID: LAUNCH-028.2
# TITLE: Commit customer template
# STATUS: pending
# DEPENDENCIES: LAUNCH-028.1
# ALLOWED FILES: customers/.git/
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit.

## REQUIRED IMPLEMENTATION

```bash
cd /workspace/customers
git init
git add .
git commit -m "feat(customers): add per-customer template (LAUNCH-028)"
```

## TESTS

```bash
cd /workspace/customers
git log -1 --pretty=%s | grep -q "LAUNCH-028" || { echo "FAIL"; exit 1; }
echo "OK"
```
