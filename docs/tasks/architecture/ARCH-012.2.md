# TASK ID: ARCH-012.2
# TITLE: Commit index
# STATUS: pending
# DEPENDENCIES: ARCH-012.1
# ALLOWED FILES: docs/.git/
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit.

## REQUIRED IMPLEMENTATION

```bash
cd /workspace/docs
git add architecture/INDEX.md
git commit -m "docs(arch): add INDEX"
```

## TESTS

```bash
cd /workspace/docs
git log -1 --pretty=%s | grep -q "INDEX" || { echo "FAIL"; exit 1; }
echo "OK"
```
