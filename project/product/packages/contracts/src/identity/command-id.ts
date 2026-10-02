import { z } from 'zod';
import type { Branded } from './brand';

/**
 * A command's identifier.
 * Format: `cmd_<22-char base32 crockford>`.
 */
export type CommandId = Branded<'CommandId', string>;

export const CommandIdSchema = z
  .string()
  .regex(/^cmd_[0-9a-hjkmnp-z]{22}$/, 'Invalid CommandId format')
  .brand<'CommandId'>();
