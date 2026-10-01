# TASK ID: EMAIL-002.2
# TITLE: Commit email backup
# STATUS: pending
# DEPENDENCIES: EMAIL-002.1
# ALLOWED FILES: platform-cloud/.git/
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit.

## REQUIRED IMPLEMENTATION

```bash
cd /workspace/platform-cloud
git add email/templates
git commit -m "feat(email): add backup-failed template (EMAIL-002)"
```

## TESTS

```bash
cd /workspace/platform-cloud
git log -1 --pretty=%s | grep -q "EMAIL-002" || { echo "FAIL"; exit 1; }
echo "OK"
```
