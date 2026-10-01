# TASK ID: ARCH-006.2
# TITLE: Commit topology
# STATUS: pending
# DEPENDENCIES: ARCH-006.1
# ALLOWED FILES: docs/.git/
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit.

## REQUIRED IMPLEMENTATION

```bash
cd /workspace/docs
git add architecture/TOPOLOGY.md
git commit -m "docs(arch): add deployment topology"
```

## TESTS

```bash
cd /workspace/docs
git log -1 --pretty=%s | grep -q "topology" || { echo "FAIL"; exit 1; }
echo "OK"
```
