import { z } from 'zod';
import type { Branded } from './brand';
/**
 * A device's stable identifier.
 * Format: `dev_<22-char base32 crockford>`.
 */
export type DeviceId = Branded<'DeviceId', string>;
export declare const DeviceIdSchema: z.ZodBranded<z.ZodString, "DeviceId">;
//# sourceMappingURL=device-id.d.ts.map