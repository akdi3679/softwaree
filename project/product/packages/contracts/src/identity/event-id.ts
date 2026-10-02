import { z } from 'zod';
import type { Branded } from './brand';

/**
 * An event's identifier.
 * Format: `evt_<22-char base32 crockford>`.
 */
export type EventId = Branded<'EventId', string>;

export const EventIdSchema = z
  .string()
  .regex(/^evt_[0-9a-hjkmnp-z]{22}$/, 'Invalid EventId format')
  .brand<'EventId'>();
