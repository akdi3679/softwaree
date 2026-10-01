# TASK ID: REPO-007.3
# TITLE: Create contracts tsconfig.json
# STATUS: pending
# DEPENDENCIES: REPO-007.2
# ALLOWED FILES: product/packages/contracts/tsconfig.json
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 2 minutes

## OBJECTIVE
Create the TypeScript config for the contracts package. Extends the base config.

## REQUIRED IMPLEMENTATION

Create the file `product/packages/contracts/tsconfig.json` with EXACTLY this content:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "./dist",
    "composite": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts", "**/*.spec.ts"]
}
```

## ACCEPTANCE CRITERIA
- [ ] File exists
- [ ] Extends `../../tsconfig.base.json`
- [ ] `rootDir` is `./src`
- [ ] `composite` is `true` (required for project references)
- [ ] Excludes test files from build output

## TESTS

```bash
cd product
test -f packages/contracts/tsconfig.json || { echo "FAIL"; exit 1; }
node -e "
const c = JSON.parse(require('fs').readFileSync('packages/contracts/tsconfig.json','utf8'));
if (!c.extends) process.exit(1);
if (c.compilerOptions.rootDir !== './src') process.exit(1);
if (c.compilerOptions.composite !== true) process.exit(1);
if (!c.exclude.includes('**/*.test.ts')) process.exit(1);
console.log('OK');
"
```
