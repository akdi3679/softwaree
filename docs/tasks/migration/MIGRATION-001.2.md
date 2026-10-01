# TASK ID: MIGRATION-001.2
# TITLE: Commit migration
# STATUS: pending
# DEPENDENCIES: MIGRATION-001.1
# ALLOWED FILES: /workspace/docs/
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit migration.

## REQUIRED IMPLEMENTATION

```bash
cd /workspace
git add docs/migration
git commit -m "docs(migration): add v1 to v2 migration plan (MIGRATION-001)" || echo "docs separate"
```

## TESTS

```bash
cd /workspace
test -f docs/migration/V1-TO-V2.md || { echo "FAIL"; exit 1; }
echo "OK"
```
