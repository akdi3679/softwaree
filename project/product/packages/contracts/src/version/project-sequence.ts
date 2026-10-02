import { z } from 'zod';
import type { Branded } from '../identity/brand';

/**
 * Admin's global monotonic event sequence per project.
 *
 * Each project has its own sequence starting at 1. Events are numbered
 * strictly in commit order. No gaps. No reuse.
 *
 * Implementation note: stored as BIGINT in SQLite/Postgres. We use bigint
 * in JS, not number, because the values can grow large (millions+).
 */
export type ProjectSequence = Branded<'ProjectSequence', bigint>;

export const ProjectSequenceSchema = z
  .bigint()
  .min(0n)
  .brand<'ProjectSequence'>();
