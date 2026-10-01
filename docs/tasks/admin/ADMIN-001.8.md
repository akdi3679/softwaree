# TASK ID: ADMIN-001.8
# TITLE: Verify the Tauri app builds and runs
# STATUS: pending
# DEPENDENCIES: ADMIN-001.7
# ALLOWED FILES: no file changes
# FORBIDDEN FILES: any file change
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
Verify the Admin Tauri app builds cleanly. Don't run the dev server; just confirm compile.

## REQUIRED IMPLEMENTATION

```bash
cd product/apps/admin
pnpm install
cargo check --manifest-path src-tauri/Cargo.toml
```

## ACCEPTANCE CRITERIA
- [ ] `cargo check` exits 0
- [ ] No Rust errors
- [ ] No missing dependencies

## TESTS

```bash
cd product/apps/admin/src-tauri
cargo check --quiet 2>&1 | tail -10
cargo check --quiet > /dev/null 2>&1 || { echo "FAIL: cargo check"; exit 1; }
echo "OK"
```
