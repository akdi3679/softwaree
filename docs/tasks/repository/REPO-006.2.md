# TASK ID: REPO-006.2
# TITLE: Add changeset scripts to root package.json
# STATUS: pending
# DEPENDENCIES: REPO-006.1
# ALLOWED FILES: product/package.json
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 2 minutes

## OBJECTIVE
Add Changesets-related scripts to the root package.json.

## REQUIRED IMPLEMENTATION

Edit `product/package.json`. Add these scripts to the `scripts` block (merge with existing scripts from REPO-003.1):

```json
"changeset": "changeset",
"changeset:version": "changeset version",
"changeset:publish": "changeset publish",
"changeset:status": "changeset status"
```

The final scripts block should be:

```json
"scripts": {
  "build": "pnpm -r build",
  "dev": "pnpm -r --parallel dev",
  "lint": "biome check .",
  "lint:fix": "biome check --write .",
  "format": "biome format --write .",
  "test": "vitest run",
  "test:watch": "vitest",
  "typecheck": "tsc -b",
  "clean": "pnpm -r exec rm -rf dist build .turbo",
  "changeset": "changeset",
  "changeset:version": "changeset version",
  "changeset:publish": "changeset publish",
  "changeset:status": "changeset status"
}
```

## ACCEPTANCE CRITERIA
- [ ] All 4 changeset scripts present in `scripts`
- [ ] Existing scripts (build, dev, lint, test, typecheck, etc.) are still present
- [ ] `pnpm changeset --version` runs

## TESTS

```bash
cd product

node -e "
const p = require('./package.json');
const required = ['changeset', 'changeset:version', 'changeset:publish', 'changeset:status'];
for (const s of required) {
  if (!p.scripts[s]) { console.log('missing script', s); process.exit(1); }
}
// Original scripts still present
for (const s of ['build','dev','lint','test','typecheck']) {
  if (!p.scripts[s]) { console.log('missing original', s); process.exit(1); }
}
"

pnpm changeset --version > /dev/null 2>&1 || { echo "FAIL: changeset not installed"; exit 1; }
echo "OK"
```

## EXPECTED OUTPUT
- `OK`
- exit 0
