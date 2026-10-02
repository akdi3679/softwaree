import { z } from 'zod';

/**
 * Standard cursor-based pagination request.
 *
 * `cursor` is opaque to the client; the server returns it in the response.
 * `limit` is the max number of items (server may return fewer).
 */
export const PaginationRequestSchema = z.object({
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(500).default(50),
  direction: z.enum(['forward', 'backward']).default('forward'),
});

export type PaginationRequest = z.infer<typeof PaginationRequestSchema>;
