import { z } from 'zod';
export const EventIdSchema = z
    .string()
    .regex(/^evt_[0-9a-hjkmnp-z]{22}$/, 'Invalid EventId format')
    .brand();
//# sourceMappingURL=event-id.js.map