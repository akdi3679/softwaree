# TASK ID: LAUNCH-024.2
# TITLE: Commit exit
# STATUS: pending
# DEPENDENCIES: LAUNCH-024.1
# ALLOWED FILES: docs/.git/
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit.

## REQUIRED IMPLEMENTATION

```bash
cd /workspace/docs
git add runbooks/EXIT-INTERVIEW.md
git commit -m "docs(runbook): add exit interview (LAUNCH-024)"
```

## TESTS

```bash
cd /workspace/docs
git log -1 --pretty=%s | grep -q "LAUNCH-024" || { echo "FAIL"; exit 1; }
echo "OK"
```
