# TASK ID: ARCH-008.1
# TITLE: Add architecture: testing strategy
# STATUS: pending
# DEPENDENCIES: ADMIN-028.2
# ALLOWED FILES: docs/architecture/TESTING.md
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Test pyramid and required test types.

## REQUIRED IMPLEMENTATION

Create `docs/architecture/TESTING.md`:

```markdown
# Testing Strategy

## Pyramid

```
       /\
      /  \      E2E (Playwright, k6, 5%)
     /────\     
    /      \    Integration (testcontainers, vitest, 25%)
   /────────\   
  /          \  Unit (cargo test, vitest, 70%)
 /────────────\ 
```

## Required tests for every feature

1. **Unit test** for every command handler
   - Valid input → success
   - Invalid input → specific error
   - Concurrency: 10 concurrent calls → no double-write

2. **Integration test** for every Cloud route
   - Auth required (401 without)
   - AuthZ required (403 wrong account)
   - 200 happy path
   - 4xx error paths
   - 5xx graceful

3. **E2E test** for every user journey
   - Signup → email verify → first project → first command
   - Backup → restore
   - Device replace

4. **Property test** (fast-check) for every contract
   - ID branded type round-trips
   - Envelope round-trips
   - Sequence monotonic

5. **Chaos test** for every stateful path
   - Restart mid-write
   - Network drop
   - our mesh down
   - DB corrupt
   - Clock skew

6. **Load test** for every scale milestone
   - 1K, 10K, 100K events
   - 10, 100, 1000 concurrent users

## Coverage targets

- Rust: 80% line, 70% branch (cargo-llvm-cov)
- TypeScript: 80% line, 70% branch (vitest coverage)
- Contracts: 100% (every type tested for round-trip)

## CI gates

- PR: `cargo test`, `pnpm test`, `cargo audit`, `pnpm audit`, `gitleaks`
- Merge to main: above + Playwright smoke + k6 smoke
- Release: above + full chaos + full load + security scan

## What we DON'T test

- Library internals (we trust them)
- UI pixel-perfect (visual regression is too brittle)
- Performance regressions below 5%

## Test data

Every test must:
- Use synthetic data (no real PII ever)
- Be deterministic (no Date.now() — use injected clock)
- Clean up after itself (no shared state between tests)
- Run in < 30s (longer = split)
```

## TESTS

```bash
cd /workspace
test -f docs/architecture/TESTING.md || { echo "FAIL"; exit 1; }
grep -q "cargo test" docs/architecture/TESTING.md || { echo "FAIL"; exit 1; }
echo "OK"
```
