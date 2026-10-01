# TASK ID: LAUNCH-018.2
# TITLE: Commit checklist
# STATUS: pending
# DEPENDENCIES: LAUNCH-018.1
# ALLOWED FILES: docs/.git/
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit.

## REQUIRED IMPLEMENTATION

```bash
cd /workspace/docs
git add marketplace/REVIEW-CHECKLIST.md
git commit -m "docs(marketplace): add review checklist (LAUNCH-018)"
```

## TESTS

```bash
cd /workspace/docs
git log -1 --pretty=%s | grep -q "LAUNCH-018" || { echo "FAIL"; exit 1; }
echo "OK"
```
