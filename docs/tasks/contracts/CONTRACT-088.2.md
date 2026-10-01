# TASK ID: CONTRACT-088.2
# TITLE: Commit flags
# STATUS: pending
# DEPENDENCIES: CONTRACT-088.1
# ALLOWED FILES: product/.git/
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit.

## REQUIRED IMPLEMENTATION

```bash
cd /workspace/product
git add contracts/src/feature_flags
git commit -m "feat(contracts): add feature flag evaluation (CONTRACT-088)"
```

## TESTS

```bash
cd /workspace/product
git log -1 --pretty=%s | grep -q "CONTRACT-088" || { echo "FAIL"; exit 1; }
echo "OK"
```
