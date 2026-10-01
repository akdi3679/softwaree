# TASK ID: CONTRACT-014.4
# TITLE: Add identity and project domain tests
# STATUS: pending
# DEPENDENCIES: CONTRACT-014.3
# ALLOWED FILES: product/packages/contracts/src/identity-domain/identity-domain.test.ts, product/packages/contracts/src/project-domain/project-domain.test.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Add tests for the identity and project domain entities.

## REQUIRED IMPLEMENTATION

Create the file `product/packages/contracts/src/identity-domain/identity-domain.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import { AccountSchema } from './index';

describe('AccountSchema', () => {
  it('rejects empty', () => {
    expect(AccountSchema.safeParse({}).success).toBe(false);
  });
});
```

Create the file `product/packages/contracts/src/project-domain/project-domain.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import { PermissionSchema, ProjectSchema } from './index';

describe('PermissionSchema', () => {
  it('accepts valid permissions', () => {
    expect(PermissionSchema.safeParse('patient.read').success).toBe(true);
    expect(PermissionSchema.safeParse('medical.patient.create').success).toBe(true);
  });
  it('rejects invalid', () => {
    expect(PermissionSchema.safeParse('patient').success).toBe(false);
    expect(PermissionSchema.safeParse('Patient.Read').success).toBe(false);
  });
});

describe('ProjectSchema', () => {
  it('rejects empty', () => {
    expect(ProjectSchema.safeParse({}).success).toBe(false);
  });
});
```

## TESTS

```bash
cd product
test -f packages/contracts/src/identity-domain/identity-domain.test.ts || { echo "FAIL"; exit 1; }
test -f packages/contracts/src/project-domain/project-domain.test.ts || { echo "FAIL"; exit 1; }
pnpm --filter @product/contracts test > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
