# TASK ID: AUDIT-031.2
# TITLE: Commit ADR-020
# STATUS: pending
# DEPENDENCIES: AUDIT-031.1
# ALLOWED FILES: docs/.git/
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit.

## REQUIRED IMPLEMENTATION

```bash
cd /workspace/docs
git add architecture/02-DECISIONS/ADR-020-discovery-service.md
git commit -m "docs(adr): ADR-020 discovery service IP-only (AUDIT-031)"
```

## TESTS

```bash
cd /workspace/docs
git log -1 --pretty=%s | grep -q "AUDIT-031" || { echo "FAIL"; exit 1; }
echo "OK"
```
