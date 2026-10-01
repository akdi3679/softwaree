# TASK ID: CONTRACT-001.1
# TITLE: Define ProjectId branded type
# STATUS: pending
# DEPENDENCIES: CONTRACT-002.1
# ALLOWED FILES: product/packages/contracts/src/identity/project-id.ts, product/packages/contracts/src/identity/index.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Define the `ProjectId` branded type and its Zod schema. Used everywhere a project is referenced.

## REQUIRED IMPLEMENTATION

Create the file `product/packages/contracts/src/identity/project-id.ts`:

```typescript
import { z } from 'zod';
import type { Branded } from './brand';

/**
 * A project's stable identifier.
 * Format: `proj_<22-char base32 crockford>` (e.g., `proj_01hxy4z8k2j9n3pqrstvw`).
 * Generated as a UUIDv7 in practice, encoded with Crockford base32 for URL safety.
 */
export type ProjectId = Branded<'ProjectId', string>;

export const ProjectIdSchema = z
  .string()
  .regex(/^proj_[0-9a-hjkmnp-z]{22}$/, 'Invalid ProjectId format')
  .brand<'ProjectId'>();
```

Then update `product/packages/contracts/src/identity/index.ts` to export it:

```typescript
/**
 * Branded ID types and Zod schemas for every entity in the platform.
 */

export type { Branded } from './brand';
export type { ProjectId } from './project-id';
export { ProjectIdSchema } from './project-id';
```

## ACCEPTANCE CRITERIA
- [ ] `project-id.ts` exists with the exact content
- [ ] `identity/index.ts` is updated to export from `project-id.ts`
- [ ] `ProjectId` is a string with a brand
- [ ] `ProjectIdSchema` is a Zod schema that validates the format
- [ ] Format is `proj_` + 22 base32 characters
- [ ] No runtime code beyond Zod schema construction

## TESTS

```bash
cd product

test -f packages/contracts/src/identity/project-id.ts || { echo "FAIL"; exit 1; }

grep -q "export type ProjectId" packages/contracts/src/identity/project-id.ts || { echo "FAIL: no type"; exit 1; }
grep -q "ProjectIdSchema" packages/contracts/src/identity/project-id.ts || { echo "FAIL: no schema"; exit 1; }
grep -q "Branded<'ProjectId', string>" packages/contracts/src/identity/project-id.ts || { echo "FAIL: wrong brand"; exit 1; }
grep -q "proj_" packages/contracts/src/identity/project-id.ts || { echo "FAIL: wrong format"; exit 1; }

grep -q "ProjectId" packages/contracts/src/identity/index.ts || { echo "FAIL: not exported"; exit 1; }

# Typecheck
pnpm --filter @product/contracts typecheck > /dev/null 2>&1 || { echo "FAIL: typecheck"; exit 1; }

# Validate that the schema accepts good IDs and rejects bad ones
cat > /tmp/pid_test.ts <<'EOF'
import { ProjectIdSchema } from './packages/contracts/src/identity/project-id';

// Should accept
const a = ProjectIdSchema.safeParse('proj_01hxy4z8k2j9n3pqrstvw');
if (!a.success) { console.log('FAIL: should accept valid'); process.exit(1); }

// Should reject (wrong prefix)
const b = ProjectIdSchema.safeParse('usr_01hxy4z8k2j9n3pqrstvw');
if (b.success) { console.log('FAIL: should reject wrong prefix'); process.exit(1); }

// Should reject (wrong length)
const c = ProjectIdSchema.safeParse('proj_short');
if (c.success) { console.log('FAIL: should reject short'); process.exit(1); }

console.log('OK');
EOF
node --experimental-strip-types /tmp/pid_test.ts 2>&1 | tail -1
node --experimental-strip-types /tmp/pid_test.ts 2>&1 | grep -q "OK" || { echo "FAIL: schema test"; exit 1; }

echo "OK"
```

## EXPECTED OUTPUT
- `OK`
- exit 0

## REFERENCE
- ADR-002-admin-as-source-of-truth.md
- CONTRACT-002.1
