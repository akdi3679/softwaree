import { z } from 'zod';
export const DurationMillisSchema = z
    .number()
    .int()
    .min(0)
    .brand();
//# sourceMappingURL=duration-millis.js.map