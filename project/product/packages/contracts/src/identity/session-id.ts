import { z } from 'zod';
import type { Branded } from './brand';

/**
 * A session's identifier.
 * Format: `sess_<22-char base32 crockford>`.
 */
export type SessionId = Branded<'SessionId', string>;

export const SessionIdSchema = z
  .string()
  .regex(/^sess_[0-9a-hjkmnp-z]{22}$/, 'Invalid SessionId format')
  .brand<'SessionId'>();
