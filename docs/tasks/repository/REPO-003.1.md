# TASK ID: REPO-003.1
# TITLE: Create root package.json
# STATUS: pending
# DEPENDENCIES: REPO-002.9
# ALLOWED FILES: product/package.json
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
Create the root `package.json` for the product monorepo. It declares the workspace, dev tools, and shared scripts.

## REQUIRED IMPLEMENTATION

Create the file `product/package.json` with EXACTLY this content:

```json
{
  "name": "product",
  "version": "0.0.0",
  "private": true,
  "description": "Customer-facing desktop platform (Admin and User Tauri apps)",
  "type": "module",
  "engines": {
    "node": ">=20.10",
    "pnpm": ">=9.0"
  },
  "packageManager": "pnpm@9.12.0",
  "scripts": {
    "build": "pnpm -r build",
    "dev": "pnpm -r --parallel dev",
    "lint": "biome check .",
    "lint:fix": "biome check --write .",
    "format": "biome format --write .",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc -b",
    "clean": "pnpm -r exec rm -rf dist build .turbo"
  },
  "devDependencies": {
    "@biomejs/biome": "^1.9.3",
    "typescript": "^5.6.3",
    "vitest": "^2.1.4"
  }
}
```

## ACCEPTANCE CRITERIA
- [ ] File exists at `product/package.json`
- [ ] Valid JSON
- [ ] `name` is `product`
- [ ] `private` is `true`
- [ ] `packageManager` is `pnpm@9.12.0`
- [ ] All scripts present and correctly named
- [ ] Biome, TypeScript, and Vitest in devDependencies

## TESTS

```bash
cd product

test -f package.json || { echo "FAIL"; exit 1; }

# Valid JSON
node -e "JSON.parse(require('fs').readFileSync('package.json','utf8'))" || { echo "FAIL: invalid JSON"; exit 1; }

# Required fields
node -e "
const p = require('./package.json');
if (p.name !== 'product') process.exit(1);
if (p.private !== true) process.exit(1);
if (p.packageManager !== 'pnpm@9.12.0') process.exit(1);
const requiredScripts = ['build','dev','lint','lint:fix','format','test','test:watch','typecheck','clean'];
for (const s of requiredScripts) {
  if (!p.scripts[s]) { console.log('missing script', s); process.exit(1); }
}
if (!p.devDependencies['@biomejs/biome']) process.exit(1);
if (!p.devDependencies['typescript']) process.exit(1);
if (!p.devDependencies['vitest']) process.exit(1);
console.log('OK');
"
```

## EXPECTED OUTPUT
- `OK`
- exit 0

## REFERENCE
- ADR-001-three-repository-model.md
- docs/architecture/03-STACK.md (B. Admin Application)
