import { z } from 'zod';
import type { Branded } from '../identity/brand';
/**
 * A duration in milliseconds.
 *
 * Used for session TTLs, timeouts, heartbeats, lease durations.
 * Branded so it cannot be confused with raw numbers.
 */
export type DurationMillis = Branded<'DurationMillis', number>;
export declare const DurationMillisSchema: z.ZodBranded<z.ZodNumber, "DurationMillis">;
//# sourceMappingURL=duration-millis.d.ts.map