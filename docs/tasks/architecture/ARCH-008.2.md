# TASK ID: ARCH-008.2
# TITLE: Commit testing
# STATUS: pending
# DEPENDENCIES: ARCH-008.1
# ALLOWED FILES: docs/.git/
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit.

## REQUIRED IMPLEMENTATION

```bash
cd /workspace/docs
git add architecture/TESTING.md
git commit -m "docs(arch): add testing strategy"
```

## TESTS

```bash
cd /workspace/docs
git log -1 --pretty=%s | grep -q "testing" || { echo "FAIL"; exit 1; }
echo "OK"
```
