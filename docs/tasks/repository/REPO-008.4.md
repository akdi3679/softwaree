# TASK ID: REPO-008.4
# TITLE: Create cloud-client barrel
# STATUS: pending
# DEPENDENCIES: REPO-008.3
# ALLOWED FILES: product/packages/cloud-client/src/index.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Create the empty barrel for `@product/cloud-client`.

## REQUIRED IMPLEMENTATION

Create the file `product/packages/cloud-client/src/index.ts`:

```typescript
/**
 * @product/cloud-client
 *
 * TypeScript SDK for talking to the platform Cloud API.
 * Used by both the Admin and User desktop apps.
 *
 * Submodules (populated by CLOUD-* tasks):
 *   ./auth      - account creation, login, session management
 *   ./devices   - device registration, replacement, revocation
 *   ./projects  - project create/list, membership, invitations
 *   ./modules   - module registry, signed package download
 *   ./audit     - platform audit log queries
 *   ./errors    - cloud-specific error types
 */

export {};
```

## ACCEPTANCE CRITERIA
- [ ] File exists with the expected content

## TESTS

```bash
cd product
test -f packages/cloud-client/src/index.ts || { echo "FAIL"; exit 1; }
grep -q "@product/cloud-client" packages/cloud-client/src/index.ts || { echo "FAIL"; exit 1; }
grep -q "export {};" packages/cloud-client/src/index.ts || { echo "FAIL"; exit 1; }
echo "OK"
```
