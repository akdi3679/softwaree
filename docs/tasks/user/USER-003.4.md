# TASK ID: USER-003.4
# TITLE: Add User README and CI workflow
# STATUS: pending
# DEPENDENCIES: USER-003.3
# ALLOWED FILES: product/apps/user/README.md, product/.github/workflows/user-build.yml
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Document and CI the User app.

## REQUIRED IMPLEMENTATION

Create `product/apps/user/README.md`:

```markdown
# User App

The read-only projection consumer. Connects to an Admin over our WireGuard mesh, receives authorized events, never writes to upstream tables.

## Tech stack
- Tauri 2 (Rust backend)
- React 19 + Vite 5
- TanStack Router + TanStack Query
- Tailwind CSS 4
- SQLite (local projection, sqlx)

## How it works

1. The User connects to the same our mesh as the Admin
2. The Admin's device appears in the **Connect** page (tag:admin)
3. User clicks Connect, performs signed handshake
4. The User receives a stream of events from the Admin's sync server
5. Events are applied to the local SQLite projection
6. UI queries the local projection (never the Admin directly)

## No write surface

The User can only read. It has no command that mutates the Admin. Adding write capability requires the User to escalate to a peer (a real-world decision the architecture deliberately forbids in v1).

## Development

```bash
pnpm install
pnpm tauri dev
```

## Build

```bash
pnpm build  # tauri build
```

## Key commands (Tauri)

- `ping` — health check
- `login_user(userId, displayName)`, `logout_user(token)`
- `get_tailscale_status` — list Admin peers on the tailnet
- `connect_to_admin(host, port, userId, projectId, authToken)` — start sync
- `disconnect_from_admin`
- `sync_now` — request a fresh delta
- `list_projection(table)` — read from the local projection
- `query_event_log(fromSequence, limit)` — read raw events
```

Create `product/.github/workflows/user-build.yml`:

```yaml
name: user-build

on:
  push:
    branches: [main]
    paths: ['apps/user/**', '.github/workflows/user-build.yml']

jobs:
  lint-test:
    runs-on: ubuntu-22.04
    defaults:
      run: { working-directory: apps/user }
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck
      - run: pnpm lint
      - run: pnpm test --run

  build:
    needs: lint-test
    strategy:
      fail-fast: false
      matrix:
        os: [ubuntu-22.04, macos-14, windows-2022]
    runs-on: ${{ matrix.os }}
    defaults:
      run: { working-directory: apps/user }
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: pnpm }
      - uses: dtolnay/rust-toolchain@stable
      - run: pnpm install --frozen-lockfile
      - run: pnpm tauri build
      - uses: actions/upload-artifact@v4
        with:
          name: user-${{ matrix.os }}
          path: |
            apps/user/src-tauri/target/release/bundle/deb/*.deb
            apps/user/src-tauri/target/release/bundle/rpm/*.rpm
            apps/user/src-tauri/target/release/bundle/appimage/*.AppImage
            apps/user/src-tauri/target/release/bundle/msi/*.msi
            apps/user/src-tauri/target/release/bundle/dmg/*.dmg
          if-no-files-found: warn
```

## TESTS

```bash
cd product
test -f apps/user/README.md || { echo "FAIL"; exit 1; }
test -f .github/workflows/user-build.yml || { echo "FAIL"; exit 1; }
grep -q "User App" apps/user/README.md || { echo "FAIL: no docs"; exit 1; }
echo "OK"
```
