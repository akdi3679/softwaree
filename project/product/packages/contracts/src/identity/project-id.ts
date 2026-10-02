import { z } from 'zod';
import type { Branded } from './brand';

/**
 * A project's stable identifier.
 * Format: `proj_<22-char base32 crockford>`.
 */
export type ProjectId = Branded<'ProjectId', string>;

export const ProjectIdSchema = z
  .string()
  .regex(/^proj_[0-9a-hjkmnp-z]{22}$/, 'Invalid ProjectId format')
  .brand<'ProjectId'>();
