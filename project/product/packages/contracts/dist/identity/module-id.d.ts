import { z } from 'zod';
import type { Branded } from './brand';
/**
 * A module's identifier.
 * Format: `mod_<22-char base32 crockford>`.
 */
export type ModuleId = Branded<'ModuleId', string>;
export declare const ModuleIdSchema: z.ZodBranded<z.ZodString, "ModuleId">;
//# sourceMappingURL=module-id.d.ts.map