# TASK ID: REPO-003.3
# TITLE: Create .npmrc
# STATUS: pending
# DEPENDENCIES: REPO-003.1
# ALLOWED FILES: product/.npmrc
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 2 minutes

## OBJECTIVE
Configure pnpm with strict, security-friendly defaults. Auto-install peers, exact versions for prod, no scripts from untrusted sources.

## REQUIRED IMPLEMENTATION

Create the file `product/.npmrc` with EXACTLY this content:

```ini
# Strict, security-friendly pnpm settings
auto-install-peers=true
strict-peer-dependencies=true
save-exact=true
save-prefix=

# Disallow running install scripts from unknown packages
# (onlyBuiltDependencies in pnpm-workspace.yaml overrides this for allowed packages)
ignore-scripts=true

# Faster, deterministic installs
frozen-lockfile=true
prefer-frozen-lockfile=true
```

## ACCEPTANCE CRITERIA
- [ ] File exists at `product/.npmrc`
- [ ] Contains the required settings (one per line)
- [ ] No other files affected

## TESTS

```bash
cd product
test -f .npmrc || { echo "FAIL"; exit 1; }

for setting in "auto-install-peers=true" "strict-peer-dependencies=true" "save-exact=true" "ignore-scripts=true" "frozen-lockfile=true"; do
  grep -q "^$setting" .npmrc || { echo "FAIL: missing $setting"; exit 1; }
done

echo "OK"
```

## EXPECTED OUTPUT
- `OK`
- exit 0

## REFERENCE
- https://pnpm.io/npmrc
- ADR-001-three-repository-model.md
