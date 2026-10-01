# TASK ID: ADMIN-079.1
# TITLE: Add Admin: per-feature smoke test in CI
# STATUS: pending
# DEPENDENCIES: ADMIN-078.2
# ALLOWED FILES: .github/workflows/smoke.yml
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Every PR: spin up Cloud + Admin, run 10 critical user flows.

## REQUIRED IMPLEMENTATION

Create `.github/workflows/smoke.yml`:

```yaml
name: Smoke
on:
  pull_request:
    branches: [main]
jobs:
  smoke:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: product
          POSTGRES_PASSWORD: dev
          POSTGRES_DB: product_test
        ports: ['5432:5432']
        options: >-
          --health-cmd "pg_isready -U product"
          --health-interval 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - name: Install Rust
        uses: dtolnay/rust-toolchain@stable
      - name: Install Node
        uses: actions/setup-node@v4
        with:
          node-version: '22'
      - name: Install pnpm
        run: npm install -g pnpm
      - name: Build
        run: |
          pnpm install --frozen-lockfile
          cd platform-cloud && pnpm build
      - name: Start Cloud
        run: |
          cd platform-cloud
          DATABASE_URL=postgres://product:dev@localhost:5432/product_test pnpm start &
          sleep 10
      - name: Run smoke
        run: |
          cd product
          pnpm --filter e2e test:smoke
      - name: Stop
        if: always()
        run: pkill -f "platform-cloud"
```

## TESTS

```bash
cd /workspace
test -f .github/workflows/smoke.yml || { echo "FAIL"; exit 1; }
grep -q "smoke" .github/workflows/smoke.yml || { echo "FAIL"; exit 1; }
echo "OK"
```
