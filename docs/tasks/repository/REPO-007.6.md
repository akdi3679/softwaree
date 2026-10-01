# TASK ID: REPO-007.6
# TITLE: Create all contracts submodule barrels
# STATUS: pending
# DEPENDENCIES: REPO-007.5
# ALLOWED FILES: product/packages/contracts/src/{commands,events,errors,results,sync,version}/index.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
Create the remaining 6 submodule barrels. Each follows the same pattern as identity.

## REQUIRED IMPLEMENTATION

```bash
cd product
for mod in commands events errors results sync version; do
  mkdir -p "packages/contracts/src/$mod"
done
```

Create these 6 files:

`packages/contracts/src/commands/index.ts`:
```typescript
/**
 * Command envelope and payload types.
 * Commands are sent from User to Admin (and from Admin to Cloud).
 * Populated by CONTRACT-020.
 */
export {};
```

`packages/contracts/src/events/index.ts`:
```typescript
/**
 * Event envelope and payload types.
 * Events are emitted by the Admin after a successful state change.
 * Populated by CONTRACT-022.
 */
export {};
```

`packages/contracts/src/errors/index.ts`:
```typescript
/**
 * Error contracts.
 * Populated by CONTRACT-011 through CONTRACT-016.
 */
export {};
```

`packages/contracts/src/results/index.ts`:
```typescript
/**
 * Success and failure result types.
 * Populated by CONTRACT-017 through CONTRACT-019.
 */
export {};
```

`packages/contracts/src/sync/index.ts`:
```typescript
/**
 * Sync request, response, and conflict types.
 * Populated by CONTRACT-023 through CONTRACT-027.
 */
export {};
```

`packages/contracts/src/version/index.ts`:
```typescript
/**
 * Version and sequence types (ProjectSequence, AggregateVersion).
 * Populated by CONTRACT-008 through CONTRACT-010.
 */
export {};
```

## ACCEPTANCE CRITERIA
- [ ] All 6 directories exist
- [ ] All 6 index.ts files exist
- [ ] Each has the expected JSDoc header and `export {};`

## TESTS

```bash
cd product

for mod in commands events errors results sync version; do
  test -d "packages/contracts/src/$mod" || { echo "FAIL: no dir $mod"; exit 1; }
  test -f "packages/contracts/src/$mod/index.ts" || { echo "FAIL: no index $mod"; exit 1; }
  grep -q "export {};" "packages/contracts/src/$mod/index.ts" || { echo "FAIL: no export $mod"; exit 1; }
done

echo "OK"
```
