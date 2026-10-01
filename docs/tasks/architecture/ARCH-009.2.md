# TASK ID: ARCH-009.2
# TITLE: Commit glossary
# STATUS: pending
# DEPENDENCIES: ARCH-009.1
# ALLOWED FILES: docs/.git/
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit.

## REQUIRED IMPLEMENTATION

```bash
cd /workspace/docs
git add architecture/GLOSSARY.md
git commit -m "docs(arch): add glossary"
```

## TESTS

```bash
cd /workspace/docs
git log -1 --pretty=%s | grep -q "glossary" || { echo "FAIL"; exit 1; }
echo "OK"
```
