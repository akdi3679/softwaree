# TASK ID: AUDIT-011.2
# TITLE: Commit ADR-014
# STATUS: pending
# DEPENDENCIES: AUDIT-011.1
# ALLOWED FILES: docs/.git/
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit.

## REQUIRED IMPLEMENTATION

```bash
cd /workspace/docs
git add architecture/02-DECISIONS/ADR-014-tailscale-headsplit.md
git commit -m "docs(adr): ADR-014 tailscale client + headscale server (AUDIT-011)"
```

## TESTS

```bash
cd /workspace/docs
git log -1 --pretty=%s | grep -q "AUDIT-011" || { echo "FAIL"; exit 1; }
echo "OK"
```
