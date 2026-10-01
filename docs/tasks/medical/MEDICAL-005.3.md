# TASK ID: MEDICAL-005.3
# TITLE: Commit medical referrals
# STATUS: pending
# DEPENDENCIES: MEDICAL-005.2
# ALLOWED FILES: product/.git/
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit.

## REQUIRED IMPLEMENTATION

```bash
cd /workspace/product
git add modules/medical-reception apps/admin
git commit -m "feat(medical): add referrals + admin UI (MEDICAL-005)"
```

## TESTS

```bash
cd /workspace/product
git log -1 --pretty=%s | grep -q "MEDICAL-005" || { echo "FAIL"; exit 1; }
echo "OK"
```
