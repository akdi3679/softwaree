# TASK ID: ARCH-020.2
# TITLE: Commit roadmap
# STATUS: pending
# DEPENDENCIES: ARCH-020.1
# ALLOWED FILES: docs/.git/
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit.

## REQUIRED IMPLEMENTATION

```bash
cd /workspace/docs
git add architecture/ROADMAP.md
git commit -m "docs(arch): add 12-month roadmap"
```

## TESTS

```bash
cd /workspace/docs
git log -1 --pretty=%s | grep -q "roadmap" || { echo "FAIL"; exit 1; }
echo "OK"
```
