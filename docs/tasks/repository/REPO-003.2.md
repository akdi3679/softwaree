# TASK ID: REPO-003.2
# TITLE: Create pnpm-workspace.yaml
# STATUS: pending
# DEPENDENCIES: REPO-003.1
# ALLOWED FILES: product/pnpm-workspace.yaml
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 2 minutes

## OBJECTIVE
Declare the pnpm workspace, listing all packages and apps that belong to the monorepo.

## REQUIRED IMPLEMENTATION

Create the file `product/pnpm-workspace.yaml` with EXACTLY this content:

```yaml
packages:
  - "apps/*"
  - "packages/*"
  - "modules/*"

# Allow build scripts from these specific packages only.
# Any package not in this list will be blocked from running install scripts.
onlyBuiltDependencies:
  - "@biomejs/biome"
  - "esbuild"
  - "better-sqlite3"
```

## ACCEPTANCE CRITERIA
- [ ] File exists at `product/pnpm-workspace.yaml`
- [ ] Valid YAML
- [ ] All three workspace globs present: `apps/*`, `packages/*`, `modules/*`
- [ ] onlyBuiltDependencies lists exactly the three allowed packages

## TESTS

```bash
cd product

test -f pnpm-workspace.yaml || { echo "FAIL"; exit 1; }

node -e "
const fs = require('fs');
const yaml = require('child_process').execSync('python3 -c \"import yaml,sys; print(yaml.safe_load(sys.stdin).get(\\\"packages\\\"))\" < pnpm-workspace.yaml', {encoding: 'utf8'}).trim();
const required = ['apps/*', 'packages/*', 'modules/*'];
for (const r of required) {
  if (!yaml.includes(r)) { console.log('missing', r); process.exit(1); }
}
console.log('OK');
" 2>/dev/null || {
  # Fallback: grep-based check
  grep -q "apps/\*" pnpm-workspace.yaml || { echo "FAIL: missing apps/*"; exit 1; }
  grep -q "packages/\*" pnpm-workspace.yaml || { echo "FAIL: missing packages/*"; exit 1; }
  grep -q "modules/\*" pnpm-workspace.yaml || { echo "FAIL: missing modules/*"; exit 1; }
  echo "OK"
}
```

## EXPECTED OUTPUT
- `OK`
- exit 0

## REFERENCE
- https://pnpm.io/pnpm-workspace_yaml
- ADR-001-three-repository-model.md
