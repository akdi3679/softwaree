import { z } from 'zod';
import type { Branded } from './brand';
/**
 * An event's identifier.
 * Format: `evt_<22-char base32 crockford>`.
 */
export type EventId = Branded<'EventId', string>;
export declare const EventIdSchema: z.ZodBranded<z.ZodString, "EventId">;
//# sourceMappingURL=event-id.d.ts.map