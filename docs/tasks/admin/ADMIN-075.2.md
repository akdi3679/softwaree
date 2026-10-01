# TASK ID: ADMIN-075.2
# TITLE: Commit tour
# STATUS: pending
# DEPENDENCIES: ADMIN-075.1
# ALLOWED FILES: product/.git/
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit.

## REQUIRED IMPLEMENTATION

```bash
cd /workspace/product
git add apps/admin
git commit -m "feat(admin): add onboarding tour (ADMIN-075)"
```

## TESTS

```bash
cd /workspace/product
git log -1 --pretty=%s | grep -q "ADMIN-075" || { echo "FAIL"; exit 1; }
echo "OK"
```
