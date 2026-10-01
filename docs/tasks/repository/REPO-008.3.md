# TASK ID: REPO-008.3
# TITLE: Create cloud-client tsconfig.json
# STATUS: pending
# DEPENDENCIES: REPO-008.2
# ALLOWED FILES: product/packages/cloud-client/tsconfig.json
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 2 minutes

## OBJECTIVE
Create the TypeScript config for the cloud-client package. Extends the base config.

## REQUIRED IMPLEMENTATION

Create the file `product/packages/cloud-client/tsconfig.json` with EXACTLY this content:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "./dist",
    "composite": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts", "**/*.spec.ts"],
  "references": [
    { "path": "../contracts" }
  ]
}
```

## ACCEPTANCE CRITERIA
- [ ] File exists
- [ ] Extends base config
- [ ] Has project reference to `../contracts`
- [ ] `composite: true`

## TESTS

```bash
cd product
test -f packages/cloud-client/tsconfig.json || { echo "FAIL"; exit 1; }
node -e "
const c = JSON.parse(require('fs').readFileSync('packages/cloud-client/tsconfig.json','utf8'));
if (!c.extends) process.exit(1);
if (c.compilerOptions.composite !== true) process.exit(1);
if (!c.references || !c.references.some(r => r.path === '../contracts')) { console.log('no contracts ref'); process.exit(1); }
console.log('OK');
"
```
