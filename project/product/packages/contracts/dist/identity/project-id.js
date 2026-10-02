import { z } from 'zod';
export const ProjectIdSchema = z
    .string()
    .regex(/^proj_[0-9a-hjkmnp-z]{22}$/, 'Invalid ProjectId format')
    .brand();
//# sourceMappingURL=project-id.js.map