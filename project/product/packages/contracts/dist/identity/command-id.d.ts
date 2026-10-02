import { z } from 'zod';
import type { Branded } from './brand';
/**
 * A command's identifier.
 * Format: `cmd_<22-char base32 crockford>`.
 */
export type CommandId = Branded<'CommandId', string>;
export declare const CommandIdSchema: z.ZodBranded<z.ZodString, "CommandId">;
//# sourceMappingURL=command-id.d.ts.map