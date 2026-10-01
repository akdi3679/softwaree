# TASK ID: LAUNCH-023.2
# TITLE: Commit school depth
# STATUS: pending
# DEPENDENCIES: LAUNCH-023.1
# ALLOWED FILES: product/.git/
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit.

## REQUIRED IMPLEMENTATION

```bash
cd /workspace/product
git add modules/school
git commit -m "feat(school): add grades + report cards (LAUNCH-023)"
```

## TESTS

```bash
cd /workspace/product
git log -1 --pretty=%s | grep -q "LAUNCH-023" || { echo "FAIL"; exit 1; }
echo "OK"
```
