import { z } from 'zod';
export const UserIdSchema = z
    .string()
    .regex(/^usr_[0-9a-hjkmnp-z]{22}$/, 'Invalid UserId format')
    .brand();
//# sourceMappingURL=user-id.js.map