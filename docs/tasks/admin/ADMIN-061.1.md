# TASK ID: ADMIN-061.1
# TITLE: Add Admin: full README with screenshots placeholders
# STATUS: pending
# DEPENDENCIES: ADMIN-060.2
# ALLOWED FILES: product/README.md
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
First impression for new developers.

## REQUIRED IMPLEMENTATION

Create `product/README.md`:

```markdown
# Product

Local-first desktop platform for clinics, food labs, gyms, schools, and other
small organizations. Admin is the source of truth; Users are read-only.

## What this is

- **Admin app** (`apps/admin/`): Tauri + React + Rust. One per project.
- **User app** (`apps/user/`): Tauri + React + Rust. Many per project.
- **Modules** (`modules/`): WASM extensions, written in Rust, run in Wasmtime.
- **Contracts** (`contracts/`): shared TypeScript + Rust types.

## Highlights

- 🔐 Triple-signed modules (cloud_root + project_license + device_bind)
- 📡 Sync over our WireGuard mesh, not via Cloud (Cloud is offline-tolerant)
- 🛡️ End-to-end signed event chains (Ed25519)
- 💾 Self-hostable, MIT/Apache-2.0
- 🌍 i18n: en, ar, fr (more coming)
- 💬 RTL support built-in

## Screenshots

*(Coming soon — see `apps/admin/src/pages/` for the live UI)*

## Quick start

```bash
pnpm install
cd apps/admin
pnpm tauri dev
```

## Architecture

Read `/workspace/docs/architecture/00-OVERVIEW.md` first.

## Contributing

See `AGENTS.md` in this directory and the micro-tasks in `/workspace/tasks/`.

## License

MIT (Tauri, React) + Apache-2.0 (our code).

## Status

Pre-release. v1.0 ships Q3 2026.
```

## TESTS

```bash
cd /workspace
test -f product/README.md || { echo "FAIL"; exit 1; }
grep -q "Tauri" product/README.md || { echo "FAIL"; exit 1; }
echo "OK"
```
