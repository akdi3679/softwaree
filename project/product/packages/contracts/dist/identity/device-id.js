import { z } from 'zod';
export const DeviceIdSchema = z
    .string()
    .regex(/^dev_[0-9a-hjkmnp-z]{22}$/, 'Invalid DeviceId format')
    .brand();
//# sourceMappingURL=device-id.js.map