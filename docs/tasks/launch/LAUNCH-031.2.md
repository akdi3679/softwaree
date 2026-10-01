# TASK ID: LAUNCH-031.2
# TITLE: Commit blog
# STATUS: pending
# DEPENDENCIES: LAUNCH-031.1
# ALLOWED FILES: marketing/.git/
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit.

## REQUIRED IMPLEMENTATION

```bash
cd /workspace/marketing
git add blog
git commit -m "feat(marketing): add launch blog post (LAUNCH-031)"
```

## TESTS

```bash
cd /workspace/marketing
git log -1 --pretty=%s | grep -q "LAUNCH-031" || { echo "FAIL"; exit 1; }
echo "OK"
```
