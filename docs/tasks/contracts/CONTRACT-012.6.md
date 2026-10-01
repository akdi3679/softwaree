# TASK ID: CONTRACT-012.6
# TITLE: Commit domain enums
# STATUS: pending
# DEPENDENCIES: CONTRACT-012.5
# ALLOWED FILES: product/.git/ only
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit domain enums.

## REQUIRED IMPLEMENTATION

```bash
cd product
git add packages/contracts/src/domain
git commit -m "feat(contracts): add domain enums (ProjectState, DeviceState, ModuleState, MembershipState, BackupState) (CONTRACT-012)"
```

## TESTS

```bash
cd product
MSG=$(git log -1 --pretty=%s)
echo "$MSG" | grep -q "CONTRACT-012" || { echo "FAIL"; exit 1; }
for f in project-state.ts device-state.ts module-state.ts membership-state.ts backup-state.ts; do
  git show HEAD --name-only --pretty= | grep -q "domain/$f" || { echo "FAIL: $f"; exit 1; }
done
echo "OK"
```
