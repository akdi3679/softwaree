import { z } from 'zod';
import type { Branded } from '../identity/brand';
/**
 * Database schema version.
 *
 * Each database file (Cloud Postgres, Admin SQLite, User SQLite) has a
 * schema version. Migrations are forward-only, named, and tracked.
 *
 * Format: major.minor (e.g., 4.2). Major bumps may be breaking; minor
 * bumps are always backwards-compatible.
 */
export type SchemaVersion = Branded<'SchemaVersion', string>;
export declare const SchemaVersionSchema: z.ZodBranded<z.ZodString, "SchemaVersion">;
//# sourceMappingURL=schema-version.d.ts.map