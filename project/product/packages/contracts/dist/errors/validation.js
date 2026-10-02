import { z } from 'zod';
import { ErrorContractSchema } from './contract';
/**
 * A field-level validation error.
 */
export const FieldErrorSchema = z.object({
    path: z.string(),
    message: z.string().min(1).max(512),
    code: z.string().optional(),
});
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
//# sourceMappingURL=validation.js.map