# TASK ID: SECURITY-002.2
# TITLE: Add dependency audit to CI
# STATUS: pending
# DEPENDENCIES: SECURITY-002.1
# ALLOWED FILES: product/.github/workflows/audit.yml
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Run cargo audit + pnpm audit on every PR.

## REQUIRED IMPLEMENTATION

Create `product/.github/workflows/audit.yml`:

```yaml
name: audit

on:
  schedule:
    - cron: '0 6 * * 1'  # every Monday at 06:00 UTC
  pull_request:
    paths:
      - '**/Cargo.toml'
      - '**/Cargo.lock'
      - '**/package.json'
      - '**/pnpm-lock.yaml'

jobs:
  cargo-audit:
    runs-on: ubuntu-22.04
    defaults:
      run: { working-directory: apps/admin }
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable
      - uses: Swatinem/rust-cache@v2
      - run: cargo install --locked cargo-audit
      - run: cargo audit --deny warnings

  cargo-audit-user:
    runs-on: ubuntu-22.04
    defaults:
      run: { working-directory: apps/user }
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable
      - uses: Swatinem/rust-cache@v2
      - run: cargo install --locked cargo-audit
      - run: cargo audit --deny warnings

  pnpm-audit:
    runs-on: ubuntu-22.04
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm audit --prod --audit-level=high
```

## TESTS

```bash
cd product
test -f .github/workflows/audit.yml || { echo "FAIL"; exit 1; }
grep -q "cargo audit" .github/workflows/audit.yml || { echo "FAIL: no cargo"; exit 1; }
grep -q "pnpm audit" .github/workflows/audit.yml || { echo "FAIL: no pnpm"; exit 1; }
echo "OK"
```
