# TASK ID: MIGRATION-002.2
# TITLE: Commit migration v2
# STATUS: pending
# DEPENDENCIES: MIGRATION-002.1
# ALLOWED FILES: docs/.git/
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit.

## REQUIRED IMPLEMENTATION

```bash
cd /workspace/docs
git add migration/V2-SCHEMA.md
git commit -m "docs(migration): add v2 schema preview"
```

## TESTS

```bash
cd /workspace/docs
git log -1 --pretty=%s | grep -q "v2 schema" || { echo "FAIL"; exit 1; }
echo "OK"
```
