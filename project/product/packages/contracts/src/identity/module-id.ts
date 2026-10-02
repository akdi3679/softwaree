import { z } from 'zod';
import type { Branded } from './brand';

/**
 * A module's identifier.
 * Format: `mod_<22-char base32 crockford>`.
 */
export type ModuleId = Branded<'ModuleId', string>;

export const ModuleIdSchema = z
  .string()
  .regex(/^mod_[0-9a-hjkmnp-z]{22}$/, 'Invalid ModuleId format')
  .brand<'ModuleId'>();
