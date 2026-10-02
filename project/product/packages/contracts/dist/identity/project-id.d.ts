import { z } from 'zod';
import type { Branded } from './brand';
/**
 * A project's stable identifier.
 * Format: `proj_<22-char base32 crockford>`.
 */
export type ProjectId = Branded<'ProjectId', string>;
export declare const ProjectIdSchema: z.ZodBranded<z.ZodString, "ProjectId">;
//# sourceMappingURL=project-id.d.ts.map