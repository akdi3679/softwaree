# TASK ID: LAUNCH-006.2
# TITLE: Commit legal
# STATUS: pending
# DEPENDENCIES: LAUNCH-006.1
# ALLOWED FILES: legal/.git/
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit.

## REQUIRED IMPLEMENTATION

```bash
cd /workspace/legal
git init
git add .
git commit -m "feat(legal): add ToS, Privacy, DPA, License (LAUNCH-006)"
```

## TESTS

```bash
cd /workspace/legal
git log -1 --pretty=%s | grep -q "LAUNCH-006" || { echo "FAIL"; exit 1; }
echo "OK"
```
