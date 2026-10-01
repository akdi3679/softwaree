# TASK ID: LAUNCH-021.2
# TITLE: Commit retail depth
# STATUS: pending
# DEPENDENCIES: LAUNCH-021.1
# ALLOWED FILES: product/.git/
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit.

## REQUIRED IMPLEMENTATION

```bash
cd /workspace/product
git add modules/retail-pos
git commit -m "feat(retail-pos): add inventory + returns (LAUNCH-021)"
```

## TESTS

```bash
cd /workspace/product
git log -1 --pretty=%s | grep -q "LAUNCH-021" || { echo "FAIL"; exit 1; }
echo "OK"
```
