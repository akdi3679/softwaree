# TASK ID: CONTRACT-012.1
# TITLE: Define ProjectState enum
# STATUS: pending
# DEPENDENCIES: CONTRACT-011.3
# ALLOWED FILES: product/packages/contracts/src/domain/project-state.ts, product/packages/contracts/src/domain/index.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Define `ProjectState` — the lifecycle states a project can be in.

## REQUIRED IMPLEMENTATION

```bash
mkdir -p product/packages/contracts/src/domain
```

Create the file `product/packages/contracts/src/domain/project-state.ts`:

```typescript
import { z } from 'zod';

/**
 * Project lifecycle states.
 *
 *  CREATING    → ACTIVE → SUSPENDED → ACTIVE → ARCHIVED
 *
 * - CREATING: project is being initialized (Admin device setting up, modules installing)
 * - ACTIVE: normal operating state
 * - SUSPENDED: temporarily disabled (billing issue, security review). Reads still possible for cache, writes blocked.
 * - ARCHIVED: terminal state, read-only. Project can be restored within 30 days, then hard-deleted.
 */
export const ProjectState = {
  CREATING: 'creating',
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  ARCHIVED: 'archived',
} as const;

export type ProjectState = (typeof ProjectState)[keyof typeof ProjectState];

export const ProjectStateSchema = z.nativeEnum(ProjectState);
```

Create the file `product/packages/contracts/src/domain/index.ts`:

```typescript
/**
 * Domain enums.
 */

export { ProjectState } from './project-state';
export type { ProjectState as ProjectStateValue } from './project-state';
export { ProjectStateSchema } from './project-state';
```

## ACCEPTANCE CRITERIA
- [ ] File exists
- [ ] 4 states defined
- [ ] Exported

## TESTS

```bash
cd product
test -f packages/contracts/src/domain/project-state.ts || { echo "FAIL"; exit 1; }
test -f packages/contracts/src/domain/index.ts || { echo "FAIL: no index"; exit 1; }
grep -q "CREATING" packages/contracts/src/domain/project-state.ts || { echo "FAIL"; exit 1; }
pnpm --filter @product/contracts typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
