# TASK ID: REPO-008.2
# TITLE: Create cloud-client package.json
# STATUS: pending
# DEPENDENCIES: REPO-008.1
# ALLOWED FILES: product/packages/cloud-client/package.json
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Create the package.json for `@product/cloud-client`. This is the TypeScript SDK the Admin and User apps use to talk to the Cloud.

## REQUIRED IMPLEMENTATION

Create the file `product/packages/cloud-client/package.json` with EXACTLY this content:

```json
{
  "name": "@product/cloud-client",
  "version": "0.0.1",
  "private": true,
  "description": "TypeScript client for the platform Cloud API (auth, projects, devices, modules, audit, backup)",
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./auth": "./src/auth.ts",
    "./devices": "./src/devices.ts",
    "./projects": "./src/projects.ts",
    "./modules": "./src/modules.ts",
    "./audit": "./src/audit.ts",
    "./errors": "./src/errors.ts"
  },
  "scripts": {
    "build": "tsc -b",
    "dev": "tsc -b --watch",
    "lint": "biome check .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  },
  "dependencies": {
    "@product/contracts": "workspace:*",
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
- [ ] `name` is `@product/cloud-client`
- [ ] `@product/contracts` is a workspace dependency
- [ ] `zod` is a dependency
- [ ] Exports map has all 7 entry points

## TESTS

```bash
cd product
test -f packages/cloud-client/package.json || { echo "FAIL"; exit 1; }
node -e "
const p = require('./packages/cloud-client/package.json');
if (p.name !== '@product/cloud-client') process.exit(1);
if (p.dependencies['@product/contracts'] !== 'workspace:*') { console.log('missing workspace dep'); process.exit(1); }
if (!p.dependencies.zod) process.exit(1);
const required = ['.', './auth', './devices', './projects', './modules', './audit', './errors'];
for (const k of required) {
  if (!p.exports[k]) { console.log('missing export', k); process.exit(1); }
}
console.log('OK');
"
```
