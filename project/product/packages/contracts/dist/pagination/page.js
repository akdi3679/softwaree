import { z } from 'zod';
/**
 * Generic paginated response.
 */
export const PageSchema = (item) => z.object({
    items: z.array(item),
    nextCursor: z.string().optional(),
    previousCursor: z.string().optional(),
    total: z.number().int().optional(),
    hasMore: z.boolean(),
});
//# sourceMappingURL=page.js.map