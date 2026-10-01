# TASK ID: LAUNCH-040.1
# TITLE: Add: final INDEX update to 1000
# STATUS: pending
# DEPENDENCIES: LAUNCH-039.2
# ALLOWED FILES: tasks/INDEX.md
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Update INDEX to reflect 1000.

## REQUIRED IMPLEMENTATION

Update `tasks/INDEX.md` to say:

```markdown
# Task Index

Total tasks: **1000** across **44 phase directories**.

## Status

**Production-ready** for v1.0 GA, pending pen-test.
```

## TESTS

```bash
cd /workspace
test -f tasks/INDEX.md || { echo "FAIL"; exit 1; }
grep -q "1000" tasks/INDEX.md || { echo "FAIL"; exit 1; }
echo "OK"
```
