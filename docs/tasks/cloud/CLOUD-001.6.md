# TASK ID: CLOUD-001.6
# TITLE: Commit cloud workspace foundation
# STATUS: pending
# DEPENDENCIES: CLOUD-001.5
# ALLOWED FILES: platform-cloud/.git/ only
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit cloud workspace setup.

## REQUIRED IMPLEMENTATION

```bash
cd platform-cloud
git add package.json pnpm-workspace.yaml .npmrc tsconfig.base.json biome.json pnpm-lock.yaml
git commit -m "chore: add pnpm workspace, Biome config (CLOUD-001)"
```

## TESTS

```bash
cd platform-cloud
MSG=$(git log -1 --pretty=%s)
echo "$MSG" | grep -q "CLOUD-001" || { echo "FAIL"; exit 1; }
git show HEAD --name-only --pretty= | grep -q "package.json" || { echo "FAIL"; exit 1; }
echo "OK"
```
