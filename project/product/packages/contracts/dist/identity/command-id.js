import { z } from 'zod';
export const CommandIdSchema = z
    .string()
    .regex(/^cmd_[0-9a-hjkmnp-z]{22}$/, 'Invalid CommandId format')
    .brand();
//# sourceMappingURL=command-id.js.map