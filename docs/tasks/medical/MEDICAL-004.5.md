# TASK ID: MEDICAL-004.5
# TITLE: Commit medical depth
# STATUS: pending
# DEPENDENCIES: MEDICAL-004.4
# ALLOWED FILES: product/.git/
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit medical depth.

## REQUIRED IMPLEMENTATION

```bash
cd /workspace/product
git add modules/medical-reception apps/admin
git commit -m "feat(medical): add prescription PDF, recurring appointments, waiting list (MEDICAL-004)"
```

## TESTS

```bash
cd /workspace/product
git log -1 --pretty=%s | grep -q "MEDICAL-004" || { echo "FAIL"; exit 1; }
echo "OK"
```
