# TASK ID: CLOUD-017.2
# TITLE: Commit quota
# STATUS: pending
# DEPENDENCIES: CLOUD-017.1
# ALLOWED FILES: platform-cloud/.git/
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit.

## REQUIRED IMPLEMENTATION

```bash
cd /workspace/platform-cloud
git add src/quotas
git commit -m "feat(cloud): add storage quota (CLOUD-017)"
```

## TESTS

```bash
cd /workspace/platform-cloud
git log -1 --pretty=%s | grep -q "CLOUD-017" || { echo "FAIL"; exit 1; }
echo "OK"
```
