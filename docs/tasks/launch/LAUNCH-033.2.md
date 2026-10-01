# TASK ID: LAUNCH-033.2
# TITLE: Commit tag
# STATUS: pending
# DEPENDENCIES: LAUNCH-033.1
# ALLOWED FILES: product/.git/
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit.

## REQUIRED IMPLEMENTATION

```bash
cd /workspace/product
git add CHANGELOG.md
git commit -m "chore: tag v1.0.0 GA (LAUNCH-033)"
git tag -a v1.0.0 -m "Product v1.0.0 GA"
```

## TESTS

```bash
cd /workspace/product
git log -1 --pretty=%s | grep -q "LAUNCH-033" || { echo "FAIL"; exit 1; }
git tag -l v1.0.0 | grep -q v1.0.0 || { echo "FAIL: no tag"; exit 1; }
echo "OK"
```
