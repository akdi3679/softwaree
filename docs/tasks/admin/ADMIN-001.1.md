# TASK ID: ADMIN-001.1
# TITLE: Initialize Tauri 2 project for Admin
# STATUS: pending
# DEPENDENCIES: CLOUD-016.3
# ALLOWED FILES: product/apps/admin/ (directory)
# FORBIDDEN FILES: any file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
Initialize a Tauri 2 project in `product/apps/admin/`. Use the React + TypeScript + Vite template.

## REQUIRED IMPLEMENTATION

```bash
cd product/apps
mkdir -p admin
cd admin
pnpm create tauri-app@latest . --template react-ts --manager pnpm --identifier com.product.admin
```

The Tauri CLI will scaffold:
- `src/` (React frontend)
- `src-tauri/` (Rust backend)
- `package.json` (pnpm)
- `vite.config.ts`
- `tsconfig.json`
- `index.html`

## ACCEPTANCE CRITERIA
- [ ] `apps/admin/` exists
- [ ] `apps/admin/src-tauri/` exists
- [ ] `apps/admin/package.json` exists
- [ ] `apps/admin/src-tauri/Cargo.toml` exists
- [ ] `apps/admin/src-tauri/tauri.conf.json` exists
- [ ] The `pnpm tauri dev` command would start the app (don't run it now, just verify files)

## TESTS

```bash
cd product
test -d apps/admin/src-tauri || { echo "FAIL: no src-tauri"; exit 1; }
test -f apps/admin/package.json || { echo "FAIL: no package.json"; exit 1; }
test -f apps/admin/src-tauri/Cargo.toml || { echo "FAIL: no Cargo.toml"; exit 1; }
test -f apps/admin/src-tauri/tauri.conf.json || { echo "FAIL: no tauri.conf.json"; exit 1; }
echo "OK"
```

## REFERENCE
- https://v2.tauri.app/start/create-project/
- ADR-006-wasmtime-module-runtime.md
