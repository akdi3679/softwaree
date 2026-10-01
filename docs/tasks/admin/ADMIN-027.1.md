# TASK ID: ADMIN-027.1
# TITLE: Add Admin: build with release mode + cargo profiles
# STATUS: pending
# DEPENDENCIES: ADMIN-026.2
# ALLOWED FILES: product/apps/admin/src-tauri/Cargo.toml, product/apps/admin/src-tauri/tauri.conf.json
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Optimize release build: small, fast, deterministic.

## REQUIRED IMPLEMENTATION

Add to `product/apps/admin/src-tauri/Cargo.toml`:
```toml
[profile.release]
codegen-units = 1
lto = true
opt-level = 3
panic = 'abort'
strip = 'symbols'
debug = false
incremental = false
```

Add to `product/apps/admin/src-tauri/tauri.conf.json`:
```json
{
  "bundle": {
    "active": true,
    "targets": "all",
    "category": "Productivity",
    "shortDescription": "Local-first admin app for Product platform",
    "longDescription": "Source of truth for project data; syncs to Users on the local network."
  },
  "updater": {
    "active": true,
    "endpoints": ["https://releases.example.com/admin/{{target}}/{{arch}}/{{current_version}}"]
  }
}
```

## TESTS

```bash
cd product
grep -q "codegen-units" apps/admin/src-tauri/Cargo.toml || { echo "FAIL"; exit 1; }
grep -q "Productivity" apps/admin/src-tauri/tauri.conf.json || { echo "FAIL"; exit 1; }
echo "OK"
```
