import { z } from 'zod';
import type { Branded } from './brand';
/**
 * A session's identifier.
 * Format: `sess_<22-char base32 crockford>`.
 */
export type SessionId = Branded<'SessionId', string>;
export declare const SessionIdSchema: z.ZodBranded<z.ZodString, "SessionId">;
//# sourceMappingURL=session-id.d.ts.map