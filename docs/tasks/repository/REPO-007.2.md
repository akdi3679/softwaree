# TASK ID: REPO-007.2
# TITLE: Create contracts package.json
# STATUS: pending
# DEPENDENCIES: REPO-007.1
# ALLOWED FILES: product/packages/contracts/package.json
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Create the package.json for `@product/contracts`. This is the shared types package used by Admin, User, and Cloud.

## REQUIRED IMPLEMENTATION

Create the file `product/packages/contracts/package.json` with EXACTLY this content:

```json
{
  "name": "@product/contracts",
  "version": "0.0.1",
  "private": true,
  "description": "Shared TypeScript types, Zod schemas, and brand primitives for the product platform",
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./identity": "./src/identity/index.ts",
    "./commands": "./src/commands/index.ts",
    "./events": "./src/events/index.ts",
    "./errors": "./src/errors/index.ts",
    "./results": "./src/results/index.ts",
    "./sync": "./src/sync/index.ts",
    "./version": "./src/version/index.ts"
  },
  "scripts": {
    "build": "tsc -b",
    "dev": "tsc -b --watch",
    "lint": "biome check .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  },
  "dependencies": {
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "typescript": "^5.6.3",
    "vitest": "^2.1.4",
    "@biomejs/biome": "^1.9.3"
  }
}
```

## ACCEPTANCE CRITERIA
- [ ] File exists
- [ ] `name` is `@product/contracts`
- [ ] `version` is `0.0.1`
- [ ] `private` is `true`
- [ ] `type` is `module`
- [ ] `zod` is in dependencies
- [ ] `exports` map has all 8 entry points: `.`, `./identity`, `./commands`, `./events`, `./errors`, `./results`, `./sync`, `./version`

## TESTS

```bash
cd product
test -f packages/contracts/package.json || { echo "FAIL"; exit 1; }

node -e "
const p = require('./packages/contracts/package.json');
if (p.name !== '@product/contracts') process.exit(1);
if (p.version !== '0.0.1') process.exit(1);
if (p.private !== true) process.exit(1);
if (p.type !== 'module') process.exit(1);
if (!p.dependencies.zod) process.exit(1);
const required = ['.', './identity', './commands', './events', './errors', './results', './sync', './version'];
for (const k of required) {
  if (!p.exports[k]) { console.log('missing export', k); process.exit(1); }
}
console.log('OK');
"
```
