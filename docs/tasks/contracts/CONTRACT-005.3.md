# TASK ID: CONTRACT-005.3
# TITLE: Define ValidationError
# STATUS: pending
# DEPENDENCIES: CONTRACT-005.2
# ALLOWED FILES: product/packages/contracts/src/errors/validation.ts, product/packages/contracts/src/errors/index.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Define `ValidationError` — extends `ErrorContract` with field-level validation errors.

## REQUIRED IMPLEMENTATION

Create the file `product/packages/contracts/src/errors/validation.ts`:

```typescript
import { z } from 'zod';
import { ErrorContractSchema } from './contract';

/**
 * A field-level validation error.
 */
export const FieldErrorSchema = z.object({
  path: z.string(), // dot-notation path, e.g., "patient.name"
  message: z.string().min(1).max(512),
  code: z.string().optional(), // e.g., "REQUIRED", "TOO_SHORT", "INVALID_FORMAT"
});

export type FieldError = z.infer<typeof FieldErrorSchema>;

/**
 * Validation error: one or more fields failed validation.
 * Always category: VALIDATION. Not retryable.
 */
export const ValidationErrorSchema = ErrorContractSchema.extend({
  category: z.literal('validation'),
  code: z.string().regex(/^VALIDATION_/, 'must start with VALIDATION_'),
  details: z
    .object({
      fields: z.array(FieldErrorSchema).min(1),
    })
    .optional(),
});

export type ValidationError = z.infer<typeof ValidationErrorSchema>;
```

Update `product/packages/contracts/src/errors/index.ts`:

```typescript
/**
 * Error contracts.
 */

export { ErrorCategory } from './category';
export type { ErrorCategory as ErrorCategoryType } from './category';
export { ErrorCategorySchema } from './category';
export type { ErrorContract } from './contract';
export { ErrorContractSchema } from './contract';
export type { FieldError, ValidationError } from './validation';
export { FieldErrorSchema, ValidationErrorSchema } from './validation';
```

## ACCEPTANCE CRITERIA
- [ ] File exists
- [ ] `FieldErrorSchema` has path, message, optional code
- [ ] `ValidationErrorSchema` is a refinement of `ErrorContractSchema` with `category: 'validation'`
- [ ] `code` must start with `VALIDATION_`
- [ ] `details.fields` is required if details present

## TESTS

```bash
cd product
test -f packages/contracts/src/errors/validation.ts || { echo "FAIL"; exit 1; }
grep -q "FieldErrorSchema" packages/contracts/src/errors/validation.ts || { echo "FAIL: no field schema"; exit 1; }
grep -q "ValidationErrorSchema" packages/contracts/src/errors/validation.ts || { echo "FAIL: no validation schema"; exit 1; }
grep -q "VALIDATION_" packages/contracts/src/errors/validation.ts || { echo "FAIL: no code prefix"; exit 1; }
pnpm --filter @product/contracts typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
