# TASK ID: AUDIT-017.2
# TITLE: Commit timezones
# STATUS: pending
# DEPENDENCIES: AUDIT-017.1
# ALLOWED FILES: docs/.git/
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit.

## REQUIRED IMPLEMENTATION

```bash
cd /workspace/docs
git add architecture/TIMEZONES-CLOCK-SKEW.md
git commit -m "docs(arch): timezones + clock skew (AUDIT-017)"
```

## TESTS

```bash
cd /workspace/docs
git log -1 --pretty=%s | grep -q "AUDIT-017" || { echo "FAIL"; exit 1; }
echo "OK"
```
