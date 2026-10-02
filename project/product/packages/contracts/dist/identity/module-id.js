import { z } from 'zod';
export const ModuleIdSchema = z
    .string()
    .regex(/^mod_[0-9a-hjkmnp-z]{22}$/, 'Invalid ModuleId format')
    .brand();
//# sourceMappingURL=module-id.js.map