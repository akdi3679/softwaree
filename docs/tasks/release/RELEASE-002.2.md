# TASK ID: RELEASE-002.2
# TITLE: Commit release
# STATUS: pending
# DEPENDENCIES: RELEASE-002.1
# ALLOWED FILES: .git/
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit.

## REQUIRED IMPLEMENTATION

```bash
cd /workspace
git add .github
git commit -m "ci: add release workflow (RELEASE-002)"
```

## TESTS

```bash
cd /workspace
git log -1 --pretty=%s | grep -q "RELEASE-002" || { echo "FAIL"; exit 1; }
echo "OK"
```
