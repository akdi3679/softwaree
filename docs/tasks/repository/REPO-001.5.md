# TASK ID: REPO-001.5
# TITLE: Set local git user identity for product repo
# STATUS: pending
# DEPENDENCIES: REPO-001.2
# ALLOWED FILES: product/.git/config (local config only)
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Configure a local git user identity so commits can be made. This sets it only for this repo (`--local`), not globally.

## REQUIRED IMPLEMENTATION

```bash
cd product
git config --local user.email "dev@product.local"
git config --local user.name "Product Dev"
```

## ACCEPTANCE CRITERIA
- [ ] `user.email` is set to `dev@product.local` in local config
- [ ] `user.name` is set to `Product Dev` in local config
- [ ] Global git config is NOT modified

## TESTS

```bash
cd product

EMAIL=$(git config --local --get user.email)
NAME=$(git config --local --get user.name)

test "$EMAIL" = "dev@product.local" || { echo "FAIL: email $EMAIL"; exit 1; }
test "$NAME" = "Product Dev" || { echo "FAIL: name $NAME"; exit 1; }

# Make sure global wasn't touched
GLOBAL_EMAIL=$(git config --global --get user.email 2>/dev/null || echo "")
test -z "$GLOBAL_EMAIL" || { echo "FAIL: global was set: $GLOBAL_EMAIL"; exit 1; }

echo "OK"
```

## EXPECTED OUTPUT
- `OK` printed to stdout
- exit code 0

## NOTE
In real CI, git identity is set by the runner. This task exists for local-dev
parity. Do not change the values without an ADR.

## REFERENCE
- ADR-001-three-repository-model.md
