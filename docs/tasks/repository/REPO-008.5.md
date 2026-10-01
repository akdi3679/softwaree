# TASK ID: REPO-008.5
# TITLE: Create cloud-client submodule stubs
# STATUS: pending
# DEPENDENCIES: REPO-008.4
# ALLOWED FILES: product/packages/cloud-client/src/{auth,devices,projects,modules,audit,errors}.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Create stub files for the 6 submodules. They will be populated by CLOUD-* tasks later.

## REQUIRED IMPLEMENTATION

Create each of these files with the same shape:

`packages/cloud-client/src/auth.ts`:
```typescript
/**
 * Cloud auth operations.
 * Populated by CLOUD-001 through CLOUD-006.
 */
export {};
```

`packages/cloud-client/src/devices.ts`:
```typescript
/**
 * Cloud device operations.
 * Populated by CLOUD-013 through CLOUD-017.
 */
export {};
```

`packages/cloud-client/src/projects.ts`:
```typescript
/**
 * Cloud project operations.
 * Populated by CLOUD-007 through CLOUD-012, CLOUD-018 through CLOUD-023.
 */
export {};
```

`packages/cloud-client/src/modules.ts`:
```typescript
/**
 * Cloud module operations.
 * Populated by CLOUD-MOD-* tasks.
 */
export {};
```

`packages/cloud-client/src/audit.ts`:
```typescript
/**
 * Cloud audit operations.
 * Populated by AUDIT-* tasks.
 */
export {};
```

`packages/cloud-client/src/errors.ts`:
```typescript
/**
 * Cloud-specific error types.
 * Populated by CLOUD-ERR-* tasks.
 */
export {};
```

## ACCEPTANCE CRITERIA
- [ ] All 6 files exist
- [ ] Each has the JSDoc header and `export {};`

## TESTS

```bash
cd product

for f in auth devices projects modules audit errors; do
  test -f "packages/cloud-client/src/$f.ts" || { echo "FAIL: $f.ts"; exit 1; }
  grep -q "export {};" "packages/cloud-client/src/$f.ts" || { echo "FAIL: $f has no export"; exit 1; }
done

echo "OK"
```
