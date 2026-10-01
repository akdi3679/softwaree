# TASK ID: REPO-003.4
# TITLE: Create tsconfig.base.json
# STATUS: pending
# DEPENDENCIES: REPO-003.1
# ALLOWED FILES: product/tsconfig.base.json
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
Create the base TypeScript configuration. All packages and apps will extend this. Strict mode is mandatory.

## REQUIRED IMPLEMENTATION

Create the file `product/tsconfig.base.json` with EXACTLY this content:

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "types": [],

    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,

    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "forceConsistentCasingInFileNames": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,

    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "incremental": true,
    "composite": false,

    "baseUrl": ".",
    "paths": {
      "@product/contracts": ["./packages/contracts/src/index.ts"],
      "@product/contracts/*": ["./packages/contracts/src/*"],
      "@product/cloud-client": ["./packages/cloud-client/src/index.ts"],
      "@product/cloud-client/*": ["./packages/cloud-client/src/*"]
    }
  },
  "exclude": ["node_modules", "dist", "build", "**/target/**"]
}
```

## ACCEPTANCE CRITERIA
- [ ] File exists at `product/tsconfig.base.json`
- [ ] Valid JSON
- [ ] `strict` is `true`
- [ ] All required strict flags are `true`:
  - noImplicitAny, strictNullChecks, strictFunctionTypes, strictBindCallApply,
    strictPropertyInitialization, noImplicitThis, alwaysStrict,
    noUnusedLocals, noUnusedParameters, exactOptionalPropertyTypes,
    noImplicitReturns, noFallthroughCasesInSwitch, noUncheckedIndexedAccess,
    noImplicitOverride, noPropertyAccessFromIndexSignature
- [ ] `target` is `ES2022`
- [ ] `module` is `ESNext`
- [ ] `moduleResolution` is `bundler`
- [ ] Path mappings for `@product/contracts` and `@product/cloud-client` present

## TESTS

```bash
cd product
test -f tsconfig.base.json || { echo "FAIL"; exit 1; }

node -e "
const c = JSON.parse(require('fs').readFileSync('tsconfig.base.json','utf8'));
const o = c.compilerOptions;
if (o.strict !== true) process.exit(1);
const required = [
  'noImplicitAny','strictNullChecks','strictFunctionTypes','strictBindCallApply',
  'strictPropertyInitialization','noImplicitThis','alwaysStrict',
  'noUnusedLocals','noUnusedParameters','exactOptionalPropertyTypes',
  'noImplicitReturns','noFallthroughCasesInSwitch','noUncheckedIndexedAccess',
  'noImplicitOverride','noPropertyAccessFromIndexSignature'
];
for (const k of required) {
  if (o[k] !== true) { console.log('missing strict:', k); process.exit(1); }
}
if (o.target !== 'ES2022') process.exit(1);
if (o.module !== 'ESNext') process.exit(1);
if (o.moduleResolution !== 'bundler') process.exit(1);
if (!o.paths['@product/contracts']) process.exit(1);
if (!o.paths['@product/cloud-client']) process.exit(1);
console.log('OK');
"
```

## EXPECTED OUTPUT
- `OK`
- exit 0

## REFERENCE
- ADR-001-three-repository-model.md
- docs/architecture/03-STACK.md
