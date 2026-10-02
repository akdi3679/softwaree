import { z } from 'zod';
import type { Branded } from './brand';

/**
 * A device's stable identifier.
 * Format: `dev_<22-char base32 crockford>`.
 */
export type DeviceId = Branded<'DeviceId', string>;

export const DeviceIdSchema = z
  .string()
  .regex(/^dev_[0-9a-hjkmnp-z]{22}$/, 'Invalid DeviceId format')
  .brand<'DeviceId'>();
