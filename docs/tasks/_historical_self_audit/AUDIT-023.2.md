# TASK ID: AUDIT-023.2
# TITLE: Commit ADR cleanup
# STATUS: pending
# DEPENDENCIES: AUDIT-023.1
# ALLOWED FILES: docs/.git/
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit.

## REQUIRED IMPLEMENTATION

```bash
cd /workspace/docs
git add architecture/02-DECISIONS/
git commit -m "docs(adr): mark ADR-003 superseded, clean Tailscale refs (AUDIT-023)"
```

## TESTS

```bash
cd /workspace/docs
git log -1 --pretty=%s | grep -q "AUDIT-023" || { echo "FAIL"; exit 1; }
echo "OK"
```
