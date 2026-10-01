# TASK ID: ADMIN-058.2
# TITLE: Commit AGENTS
# STATUS: pending
# DEPENDENCIES: ADMIN-058.1
# ALLOWED FILES: product/.git/
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit.

## REQUIRED IMPLEMENTATION

```bash
cd /workspace/product
git add AGENTS.md
git commit -m "docs: add AGENTS.md (ADMIN-058)"
```

## TESTS

```bash
cd /workspace/product
git log -1 --pretty=%s | grep -q "ADMIN-058" || { echo "FAIL"; exit 1; }
echo "OK"
```
