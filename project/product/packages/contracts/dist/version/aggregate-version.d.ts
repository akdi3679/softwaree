import { z } from 'zod';
import type { Branded } from '../identity/brand';
/**
 * Per-aggregate optimistic concurrency version.
 *
 * Each business entity (patient, appointment, lab sample, etc.) has its own
 * version counter. Starts at 1. Increments on every successful update.
 *
 * Used for optimistic concurrency control: an update specifies the expected
 * version, the update only succeeds if the version matches.
 */
export type AggregateVersion = Branded<'AggregateVersion', number>;
export declare const AggregateVersionSchema: z.ZodBranded<z.ZodNumber, "AggregateVersion">;
//# sourceMappingURL=aggregate-version.d.ts.map