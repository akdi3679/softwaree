import { z } from 'zod';
import { ErrorContractSchema } from './contract';

/**
 * Conflict error: the operation conflicts with the current state.
 *
 * Most common cause: optimistic concurrency — the entity was modified
 * between when the client read it and when the client tried to update.
 * Client should re-fetch and retry.
 *
 * Always category: CONFLICT. Retryable after re-fetch.
 *
 * `code` values:
 *   CONFLICT_VERSION_MISMATCH
 *   CONFLICT_DUPLICATE_KEY
 *   CONFLICT_INVARIANT_VIOLATION
 *   CONFLICT_RESOURCE_LOCKED
 */
export const ConflictErrorSchema = ErrorContractSchema.extend({
  category: z.literal('conflict'),
  code: z.string().regex(/^CONFLICT_/, 'must start with CONFLICT_'),
  details: z
    .object({
      expectedVersion: z.number().int().optional(),
      actualVersion: z.number().int().optional(),
      conflictingField: z.string().optional(),
    })
    .optional(),
});

export type ConflictError = z.infer<typeof ConflictErrorSchema>;
