# TASK ID: CONTRACT-012.3
# TITLE: Define ModuleState enum
# STATUS: pending
# DEPENDENCIES: CONTRACT-012.2
# ALLOWED FILES: product/packages/contracts/src/domain/module-state.ts, product/packages/contracts/src/domain/index.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Define `ModuleState` — lifecycle states a module can be in within a project.

## REQUIRED IMPLEMENTATION

Create the file `product/packages/contracts/src/domain/module-state.ts`:

```typescript
import { z } from 'zod';

/**
 * Module lifecycle states (per project).
 *
 *  DISCOVERED → DOWNLOADED → VERIFIED → INSTALLED → ENABLED → (DISABLED | UNINSTALLED)
 *
 * - DISCOVERED: module available in registry, not yet downloaded
 * - DOWNLOADED: Admin has the package locally
 * - VERIFIED: signatures checked, integrity confirmed
 * - INSTALLED: schema applied, registered in module_registry table
 * - ENABLED: runtime loaded, accepting commands
 * - DISABLED: runtime not loaded, but still in registry (can be re-enabled)
 * - UNINSTALLED: removed from registry (terminal)
 */
export const ModuleState = {
  DISCOVERED: 'discovered',
  DOWNLOADED: 'downloaded',
  VERIFIED: 'verified',
  INSTALLED: 'installed',
  ENABLED: 'enabled',
  DISABLED: 'disabled',
  UNINSTALLED: 'uninstalled',
} as const;

export type ModuleState = (typeof ModuleState)[keyof typeof ModuleState];

export const ModuleStateSchema = z.nativeEnum(ModuleState);
```

Update `product/packages/contracts/src/domain/index.ts` to add the export.

## ACCEPTANCE CRITERIA
- [ ] File exists
- [ ] 7 states defined
- [ ] Exported

## TESTS

```bash
cd product
test -f packages/contracts/src/domain/module-state.ts || { echo "FAIL"; exit 1; }
COUNT=$(grep -c "^\s*[A-Z_]\+:" packages/contracts/src/domain/module-state.ts)
test "$COUNT" -eq 7 || { echo "FAIL: $COUNT"; exit 1; }
pnpm --filter @product/contracts typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
