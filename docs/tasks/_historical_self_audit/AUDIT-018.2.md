# TASK ID: AUDIT-018.2
# TITLE: Commit ADR-017
# STATUS: pending
# DEPENDENCIES: AUDIT-018.1
# ALLOWED FILES: docs/.git/
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit.

## REQUIRED IMPLEMENTATION

```bash
cd /workspace/docs
git add architecture/02-DECISIONS/ADR-017-pure-local-networking.md
git commit -m "docs(adr): ADR-017 pure local networking no third party (AUDIT-018)"
```

## TESTS

```bash
cd /workspace/docs
git log -1 --pretty=%s | grep -q "AUDIT-018" || { echo "FAIL"; exit 1; }
echo "OK"
```
