# TASK ID: ARCH-015.2
# TITLE: Commit FAQ
# STATUS: pending
# DEPENDENCIES: ARCH-015.1
# ALLOWED FILES: docs/.git/
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit.

## REQUIRED IMPLEMENTATION

```bash
cd /workspace/docs
git add FAQ.md
git commit -m "docs: add FAQ"
```

## TESTS

```bash
cd /workspace/docs
git log -1 --pretty=%s | grep -q "FAQ" || { echo "FAIL"; exit 1; }
echo "OK"
```
