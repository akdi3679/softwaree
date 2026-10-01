# TASK ID: EMAIL-001.2
# TITLE: Commit email
# STATUS: pending
# DEPENDENCIES: EMAIL-001.1
# ALLOWED FILES: platform-cloud/.git/
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit email.

## REQUIRED IMPLEMENTATION

```bash
cd /workspace/platform-cloud
git add src/email
git commit -m "feat(email): add SMTP + templates (EMAIL-001)"
```

## TESTS

```bash
cd /workspace/platform-cloud
git log -1 --pretty=%s | grep -q "EMAIL-001" || { echo "FAIL"; exit 1; }
echo "OK"
```
