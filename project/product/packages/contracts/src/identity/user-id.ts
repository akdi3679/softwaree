import { z } from 'zod';
import type { Branded } from './brand';

/**
 * A user's stable identifier.
 * Format: `usr_<22-char base32 crockford>`.
 */
export type UserId = Branded<'UserId', string>;

export const UserIdSchema = z
  .string()
  .regex(/^usr_[0-9a-hjkmnp-z]{22}$/, 'Invalid UserId format')
  .brand<'UserId'>();
