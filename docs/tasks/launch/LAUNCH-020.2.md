# TASK ID: LAUNCH-020.2
# TITLE: Commit terraform
# STATUS: pending
# DEPENDENCIES: LAUNCH-020.1
# ALLOWED FILES: deploy/.git/
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit.

## REQUIRED IMPLEMENTATION

```bash
cd /workspace/deploy
git init
git add .
git commit -m "feat(deploy): add Terraform provisioning (LAUNCH-020)"
```

## TESTS

```bash
cd /workspace/deploy
git log -1 --pretty=%s | grep -q "LAUNCH-020" || { echo "FAIL"; exit 1; }
echo "OK"
```
