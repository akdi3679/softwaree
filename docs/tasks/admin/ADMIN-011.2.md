# TASK ID: ADMIN-011.2
# TITLE: Add package.json scripts for build/release
# STATUS: pending
# DEPENDENCIES: ADMIN-011.1
# ALLOWED FILES: product/apps/admin/package.json
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Add build, dev, lint, test, release scripts.

## REQUIRED IMPLEMENTATION

Update `product/apps/admin/package.json` `scripts` section:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tauri build",
    "build:debug": "tauri build --debug",
    "tauri": "tauri",
    "preview": "vite preview",
    "lint": "biome check .",
    "lint:fix": "biome check --write .",
    "format": "biome format --write .",
    "test": "vitest",
    "test:watch": "vitest --watch",
    "typecheck": "tsc --noEmit",
    "release:patch": "pnpm changeset && pnpm version patch",
    "release:minor": "pnpm changeset && pnpm version minor"
  }
}
```

## TESTS

```bash
cd product
test -f apps/admin/package.json || { echo "FAIL"; exit 1; }
grep -q '"build"' apps/admin/package.json || { echo "FAIL: no build"; exit 1; }
grep -q '"tauri build"' apps/admin/package.json || { echo "FAIL: no tauri build"; exit 1; }
echo "OK"
```
