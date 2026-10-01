# TASK ID: AUDIT-024.2
# TITLE: Commit STACK cleanup
# STATUS: pending
# DEPENDENCIES: AUDIT-024.1
# ALLOWED FILES: docs/.git/
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit.

## REQUIRED IMPLEMENTATION

```bash
cd /workspace/docs
git add architecture/03-STACK.md architecture/00-OVERVIEW.md build/SESSION-PLAN.md
git commit -m "docs: clean Tailscale/Headscale from STACK/OVERVIEW/SESSION-PLAN (AUDIT-024)"
```

## TESTS

```bash
cd /workspace/docs
git log -1 --pretty=%s | grep -q "AUDIT-024" || { echo "FAIL"; exit 1; }
echo "OK"
```
