# TASK ID: ARCH-022.2
# TITLE: Commit NOT-IN-V1
# STATUS: pending
# DEPENDENCIES: ARCH-022.1
# ALLOWED FILES: docs/.git/
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit.

## REQUIRED IMPLEMENTATION

```bash
cd /workspace/docs
git add architecture/NOT-IN-V1.md
git commit -m "docs(arch): add NOT-IN-V1"
```

## TESTS

```bash
cd /workspace/docs
git log -1 --pretty=%s | grep -q "NOT-IN" || { echo "FAIL"; exit 1; }
echo "OK"
```
