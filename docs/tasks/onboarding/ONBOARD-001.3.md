# TASK ID: ONBOARD-001.3
# TITLE: Commit onboarding
# STATUS: pending
# DEPENDENCIES: ONBOARD-001.2
# ALLOWED FILES: product/.git/, platform-cloud/.git/
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit onboarding.

## REQUIRED IMPLEMENTATION

```bash
cd /workspace/platform-cloud
git add src/onboarding
git commit -m "feat(onboarding): add signup + email verification (ONBOARD-001)"

cd /workspace/product
git add apps/admin/src/pages/Welcome.tsx
git commit -m "feat(onboarding): add first-run wizard (ONBOARD-001)"
```

## TESTS

```bash
cd /workspace/platform-cloud
git log -1 --pretty=%s | grep -q "ONBOARD-001" || { echo "FAIL"; exit 1; }
echo "OK"
```
