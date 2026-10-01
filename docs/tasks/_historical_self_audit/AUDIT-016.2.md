# TASK ID: AUDIT-016.2
# TITLE: Commit GDPR
# STATUS: pending
# DEPENDENCIES: AUDIT-016.1
# ALLOWED FILES: docs/.git/
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit.

## REQUIRED IMPLEMENTATION

```bash
cd /workspace/docs
git add compliance/GDPR-FORGETTING.md
git commit -m "docs(gdpr): right to be forgotten incl backups (AUDIT-016)"
```

## TESTS

```bash
cd /workspace/docs
git log -1 --pretty=%s | grep -q "AUDIT-016" || { echo "FAIL"; exit 1; }
echo "OK"
```
