import { z } from 'zod';
/**
 * Generic paginated response.
 */
export declare const PageSchema: <T extends z.ZodTypeAny>(item: T) => z.ZodObject<{
    items: z.ZodArray<T, "many">;
    nextCursor: z.ZodOptional<z.ZodString>;
    previousCursor: z.ZodOptional<z.ZodString>;
    total: z.ZodOptional<z.ZodNumber>;
    hasMore: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    items: T["_output"][];
    hasMore: boolean;
    nextCursor?: string | undefined;
    previousCursor?: string | undefined;
    total?: number | undefined;
}, {
    items: T["_input"][];
    hasMore: boolean;
    nextCursor?: string | undefined;
    previousCursor?: string | undefined;
    total?: number | undefined;
}>;
export interface Page<T> {
    items: T[];
    nextCursor?: string;
    previousCursor?: string;
    total?: number;
    hasMore: boolean;
}
//# sourceMappingURL=page.d.ts.map