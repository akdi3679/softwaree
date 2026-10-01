# TASK ID: ARCH-021.2
# TITLE: Commit INDEX
# STATUS: pending
# DEPENDENCIES: ARCH-021.1
# ALLOWED FILES: docs/.git/
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit.

## REQUIRED IMPLEMENTATION

```bash
cd /workspace/docs
git add INDEX.md
git commit -m "docs: add master INDEX"
```

## TESTS

```bash
cd /workspace/docs
git log -1 --pretty=%s | grep -q "INDEX" || { echo "FAIL"; exit 1; }
echo "OK"
```
