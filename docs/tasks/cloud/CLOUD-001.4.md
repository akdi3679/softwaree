# TASK ID: CLOUD-001.4
# TITLE: Create pnpm workspace
# STATUS: pending
# DEPENDENCIES: CLOUD-001.3
# ALLOWED FILES: platform-cloud/package.json, platform-cloud/pnpm-workspace.yaml, platform-cloud/.npmrc, platform-cloud/tsconfig.base.json
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
Set up pnpm workspace for platform-cloud.

## REQUIRED IMPLEMENTATION

Create `platform-cloud/package.json`:

```json
{
  "name": "platform-cloud",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "engines": { "node": ">=22", "pnpm": ">=9" },
  "packageManager": "pnpm@9.12.0",
  "scripts": {
    "build": "pnpm -r build",
    "dev": "pnpm --filter @cloud/api dev",
    "lint": "biome check .",
    "lint:fix": "biome check --write .",
    "test": "vitest run",
    "typecheck": "tsc -b",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "tsx src/db/migrate.ts",
    "db:studio": "drizzle-kit studio"
  },
  "devDependencies": {
    "@biomejs/biome": "^1.9.3",
    "@types/node": "^22.7.0",
    "drizzle-kit": "^0.28.0",
    "tsx": "^4.19.0",
    "typescript": "^5.6.3",
    "vitest": "^2.1.4"
  }
}
```

Create `platform-cloud/pnpm-workspace.yaml`:

```yaml
packages:
  - "apps/*"
  - "packages/*"
onlyBuiltDependencies:
  - "@biomejs/biome"
  - "esbuild"
```

Create `platform-cloud/.npmrc`:

```ini
auto-install-peers=true
strict-peer-dependencies=true
save-exact=true
ignore-scripts=true
frozen-lockfile=true
```

Create `platform-cloud/tsconfig.base.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022"],
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    "incremental": true
  },
  "exclude": ["node_modules", "dist"]
}
```

## TESTS

```bash
cd platform-cloud
pnpm install
pnpm --filter @cloud/api typecheck 2>&1 | head -5 || true
test -d node_modules || { echo "FAIL"; exit 1; }
echo "OK"
```
