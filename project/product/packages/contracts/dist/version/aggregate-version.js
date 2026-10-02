import { z } from 'zod';
export const AggregateVersionSchema = z
    .number()
    .int()
    .min(1)
    .brand();
//# sourceMappingURL=aggregate-version.js.map