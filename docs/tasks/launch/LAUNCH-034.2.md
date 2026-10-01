# TASK ID: LAUNCH-034.2
# TITLE: Commit ship-it
# STATUS: pending
# DEPENDENCIES: LAUNCH-034.1
# ALLOWED FILES: docs/.git/
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit.

## REQUIRED IMPLEMENTATION

```bash
cd /workspace/docs
git add launch
git commit -m "docs(launch): add day 1-7 plan (LAUNCH-034)"
```

## TESTS

```bash
cd /workspace/docs
git log -1 --pretty=%s | grep -q "LAUNCH-034" || { echo "FAIL"; exit 1; }
echo "OK"
```
