# TASK ID: REPO-001.3
# TITLE: Create product/.gitignore
# STATUS: pending
# DEPENDENCIES: REPO-001.2
# ALLOWED FILES: product/.gitignore
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
Create the root `.gitignore` for the `product` repo. Must exclude Node, Rust, Tauri, IDE, and OS-specific files.

## REQUIRED IMPLEMENTATION

Create the file `product/.gitignore` with EXACTLY this content:

```gitignore
# Dependencies
node_modules/
.pnpm-store/
.pnp
.pnp.js

# Build output
dist/
build/
out/
*.tsbuildinfo

# Tauri / Rust
src-tauri/target/
src-tauri/Cargo.lock
src-tauri/gen/schemas/

# Environment
.env
.env.local
.env.*.local
!.env.example

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# Editor / OS
.vscode/
.idea/
*.swp
*.swo
.DS_Store
Thumbs.db
desktop.ini

# Coverage / test
coverage/
.nyc_output/
*.lcov

# Local keys (NEVER commit)
*.pem
*.key
*.p12
*.pfx
keys/
*.bak

# WireGuard interface state (never commit)
tailscale.state
```

## ACCEPTANCE CRITERIA
- [ ] File exists at `product/.gitignore`
- [ ] File content matches exactly (whitespace, blank lines, comments)
- [ ] `git check-ignore` confirms these paths would be ignored:
  - `node_modules/foo`
  - `src-tauri/target/debug/main`
  - `.env`
  - `keys/admin.pem`
  - `desktop.ini`
- [ ] File size is approximately 800-1200 bytes

## TESTS

```bash
cd product

# File exists
test -f .gitignore || { echo "FAIL: .gitignore missing"; exit 1; }

# File size is in expected range
SIZE=$(wc -c < .gitignore)
test "$SIZE" -ge 500 && test "$SIZE" -le 2000 || { echo "FAIL: size $SIZE"; exit 1; }

# Required exclusions are effective
git check-ignore node_modules/foo src-tauri/target/debug/main .env keys/admin.pem desktop.ini > /dev/null || { echo "FAIL: exclusions not effective"; exit 1; }

# These must NOT be ignored
git check-ignore package.json src/index.ts > /dev/null 2>&1 && { echo "FAIL: ignoring source files"; exit 1; }

echo "OK"
```

## EXPECTED OUTPUT
- `OK` printed to stdout
- exit code 0

## REFERENCE
- ADR-001-three-repository-model.md
- https://tauri.app/v2/guides/develop/
