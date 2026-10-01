# TASK ID: REPO-004.2
# TITLE: Verify biome can be installed and run
# STATUS: pending
# DEPENDENCIES: REPO-004.1
# ALLOWED FILES: product/pnpm-lock.yaml, product/node_modules/ (new), product/biome.json (no change)
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Install dependencies and run Biome to confirm the configuration is valid.

## REQUIRED IMPLEMENTATION

```bash
cd product
pnpm install
pnpm exec biome --version
pnpm run lint -- --max-diagnostics=5
```

## ACCEPTANCE CRITERIA
- [ ] `pnpm install` completes successfully (exit 0)
- [ ] `pnpm-lock.yaml` is created
- [ ] `biome --version` prints a version string starting with `1.9.`
- [ ] `biome check` runs without crashing on the configuration
- [ ] No source files exist yet, so no lint errors expected (configuration is valid)

## TESTS

```bash
cd product

# pnpm-lock.yaml must exist
test -f pnpm-lock.yaml || { echo "FAIL: no lockfile"; exit 1; }

# node_modules must exist
test -d node_modules || { echo "FAIL: no node_modules"; exit 1; }

# Biome version
VER=$(pnpm exec biome --version 2>&1)
echo "$VER" | grep -q "^1\.9\." || { echo "FAIL: biome version $VER"; exit 1; }

# Biome can read the config
pnpm exec biome check --help > /dev/null 2>&1 || { echo "FAIL: biome check broken"; exit 1; }

echo "OK"
```

## EXPECTED OUTPUT
- `OK`
- exit 0

## REFERENCE
- https://biomejs.dev/
- REPO-004.1
