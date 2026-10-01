# TASK ID: CONTRACT-016.6
# TITLE: Commit module domain
# STATUS: pending
# DEPENDENCIES: CONTRACT-016.5
# ALLOWED FILES: product/.git/ only
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit module domain.

## REQUIRED IMPLEMENTATION

```bash
cd product
git add packages/contracts/src/module-domain
git commit -m "feat(contracts): add module domain (Manifest, Signature, Package, RegistryEntry) (CONTRACT-016)"
```

## TESTS

```bash
cd product
MSG=$(git log -1 --pretty=%s)
echo "$MSG" | grep -q "CONTRACT-016" || { echo "FAIL"; exit 1; }
echo "OK"
```
