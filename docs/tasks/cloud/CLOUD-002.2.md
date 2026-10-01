# TASK ID: CLOUD-002.2
# TITLE: Create API package.json
# STATUS: pending
# DEPENDENCIES: CLOUD-002.1
# ALLOWED FILES: platform-cloud/apps/api/package.json
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Create the API app's package.json with Hono, Drizzle, Zod.

## REQUIRED IMPLEMENTATION

Create `platform-cloud/apps/api/package.json`:

```json
{
  "name": "@cloud/api",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc -b",
    "start": "node dist/index.js",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "lint": "biome check ."
  },
  "dependencies": {
    "hono": "^4.6.0",
    "@hono/node-server": "^1.13.0",
    "drizzle-orm": "^0.36.0",
    "postgres": "^3.4.4",
    "zod": "^3.23.8",
    "pino": "^9.5.0",
    "pino-pretty": "^11.3.0",
    "@product/contracts": "workspace:*"
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

## TESTS

```bash
cd platform-cloud
test -f apps/api/package.json || { echo "FAIL"; exit 1; }
node -e "
const p = require('./apps/api/package.json');
if (p.dependencies.hono) console.log('OK');
else process.exit(1);
"
```
