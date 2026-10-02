import { z } from 'zod';
import type { Branded } from '../identity/brand';
/**
 * An instant in time, as a Date.
 *
 * Used in all envelopes, audit entries, and events. Branded so it cannot
 * be confused with arbitrary Date values.
 */
export type Timestamp = Branded<'Timestamp', Date>;
export declare const TimestampSchema: z.ZodBranded<z.ZodDate, "Timestamp">;
//# sourceMappingURL=timestamp.d.ts.map