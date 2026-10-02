import { z } from 'zod';
import type { Branded } from './brand';
/**
 * A user's stable identifier.
 * Format: `usr_<22-char base32 crockford>`.
 */
export type UserId = Branded<'UserId', string>;
export declare const UserIdSchema: z.ZodBranded<z.ZodString, "UserId">;
//# sourceMappingURL=user-id.d.ts.map