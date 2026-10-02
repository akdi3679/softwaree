import { z } from 'zod';
export const SessionIdSchema = z
    .string()
    .regex(/^sess_[0-9a-hjkmnp-z]{22}$/, 'Invalid SessionId format')
    .brand();
//# sourceMappingURL=session-id.js.map