# TASK ID: ARCH-018.2
# TITLE: Commit deprecation
# STATUS: pending
# DEPENDENCIES: ARCH-018.1
# ALLOWED FILES: docs/.git/
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit.

## REQUIRED IMPLEMENTATION

```bash
cd /workspace/docs
git add architecture/DEPRECATION.md
git commit -m "docs(arch): add deprecation policy"
```

## TESTS

```bash
cd /workspace/docs
git log -1 --pretty=%s | grep -q "deprecat" || { echo "FAIL"; exit 1; }
echo "OK"
```
