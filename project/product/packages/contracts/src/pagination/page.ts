import { z } from 'zod';

/**
 * Generic paginated response.
 */
export const PageSchema = <T extends z.ZodTypeAny>(item: T) =>
  z.object({
    items: z.array(item),
    nextCursor: z.string().optional(),
    previousCursor: z.string().optional(),
    total: z.number().int().optional(),
    hasMore: z.boolean(),
  });

export interface Page<T> {
  items: T[];
  nextCursor?: string;
  previousCursor?: string;
  total?: number;
  hasMore: boolean;
}
