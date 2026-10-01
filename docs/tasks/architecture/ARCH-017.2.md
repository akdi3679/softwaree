# TASK ID: ARCH-017.2
# TITLE: Commit postmortem
# STATUS: pending
# DEPENDENCIES: ARCH-017.1
# ALLOWED FILES: docs/.git/
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit.

## REQUIRED IMPLEMENTATION

```bash
cd /workspace/docs
git add templates/POSTMORTEM.md
git commit -m "docs: add postmortem template"
```

## TESTS

```bash
cd /workspace/docs
git log -1 --pretty=%s | grep -q "postmortem" || { echo "FAIL"; exit 1; }
echo "OK"
```
