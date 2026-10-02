import { z } from 'zod';
import type { Branded } from '../identity/brand';

/**
 * A duration in milliseconds.
 *
 * Used for session TTLs, timeouts, heartbeats, lease durations.
 * Branded so it cannot be confused with raw numbers.
 */
export type DurationMillis = Branded<'DurationMillis', number>;

export const DurationMillisSchema = z
  .number()
  .int()
  .min(0)
  .brand<'DurationMillis'>();
