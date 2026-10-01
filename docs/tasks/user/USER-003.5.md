# TASK ID: USER-003.5
# TITLE: Commit User frontend
# STATUS: pending
# DEPENDENCIES: USER-003.4
# ALLOWED FILES: product/.git/ only
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit User frontend + CI.

## REQUIRED IMPLEMENTATION

```bash
cd product
git add apps/user .github/workflows/user-build.yml
git commit -m "feat(user): add React frontend (Connect, Dashboard, Users, Events) + CI (USER-003)"
git tag user-v0.1.0
```

## TESTS

```bash
cd product
MSG=$(git log -1 --pretty=%s)
echo "$MSG" | grep -q "USER-003" || { echo "FAIL"; exit 1; }
git tag -l | grep -q "user-v0.1.0" || { echo "FAIL: no tag"; exit 1; }
echo "OK"
```
