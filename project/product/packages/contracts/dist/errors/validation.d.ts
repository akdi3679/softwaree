import { z } from 'zod';
/**
 * A field-level validation error.
 */
export declare const FieldErrorSchema: z.ZodObject<{
    path: z.ZodString;
    message: z.ZodString;
    code: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    path: string;
    message: string;
    code?: string | undefined;
}, {
    path: string;
    message: string;
    code?: string | undefined;
}>;
export type FieldError = z.infer<typeof FieldErrorSchema>;
/**
 * Validation error: one or more fields failed validation.
 * Always category: VALIDATION. Not retryable.
 */
export declare const ValidationErrorSchema: z.ZodObject<{
    message: z.ZodString;
    correlationId: z.ZodOptional<z.ZodString>;
    timestamp: z.ZodString;
} & {
    category: z.ZodLiteral<"validation">;
    code: z.ZodString;
    details: z.ZodOptional<z.ZodObject<{
        fields: z.ZodArray<z.ZodObject<{
            path: z.ZodString;
            message: z.ZodString;
            code: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            path: string;
            message: string;
            code?: string | undefined;
        }, {
            path: string;
            message: string;
            code?: string | undefined;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        fields: {
            path: string;
            message: string;
            code?: string | undefined;
        }[];
    }, {
        fields: {
            path: string;
            message: string;
            code?: string | undefined;
        }[];
    }>>;
}, "strip", z.ZodTypeAny, {
    code: string;
    message: string;
    category: "validation";
    timestamp: string;
    correlationId?: string | undefined;
    details?: {
        fields: {
            path: string;
            message: string;
            code?: string | undefined;
        }[];
    } | undefined;
}, {
    code: string;
    message: string;
    category: "validation";
    timestamp: string;
    correlationId?: string | undefined;
    details?: {
        fields: {
            path: string;
            message: string;
            code?: string | undefined;
        }[];
    } | undefined;
}>;
export type ValidationError = z.infer<typeof ValidationErrorSchema>;
//# sourceMappingURL=validation.d.ts.map