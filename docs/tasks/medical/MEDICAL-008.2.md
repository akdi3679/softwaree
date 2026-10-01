# TASK ID: MEDICAL-008.2
# TITLE: Commit medical conditions
# STATUS: pending
# DEPENDENCIES: MEDICAL-008.1
# ALLOWED FILES: product/.git/
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit.

## REQUIRED IMPLEMENTATION

```bash
cd /workspace/product
git add modules/medical-reception
git commit -m "feat(medical): add chronic conditions (MEDICAL-008)"
```

## TESTS

```bash
cd /workspace/product
git log -1 --pretty=%s | grep -q "MEDICAL-008" || { echo "FAIL"; exit 1; }
echo "OK"
```
