import { z } from 'zod';

/**
 * A module's manifest, signed by the Cloud's root signing key.
 *
 * The manifest describes what the module is, what it needs, what it provides.
 * The actual binary is in a separate `package` file.
 */
export const ModuleManifestSchema = z.object({
  moduleId: z.string().min(1).max(64).regex(/^[a-z][a-z0-9_-]*$/),
  name: z.string().min(1).max(128),
  version: z.string().regex(/^\d+\.\d+\.\d+$/, 'semver'),
  description: z.string(),

  minCoreVersion: z.string().regex(/^\d+\.\d+\.\d+$/),
  minAppVersion: z.string().regex(/^\d+\.\d+\.\d+$/),

  requiredPermissions: z.array(z.string()).default([]),
  providedCommands: z.array(z.string()).default([]),
  providedEvents: z.array(z.string()).default([]),
  providedQueries: z.array(z.string()).default([]),

  schemaMigrations: z.array(z.object({
    version: z.number().int().min(1),
    up: z.string(),
    down: z.string().optional(),
  })),

  capabilities: z.array(z.enum([
    'read_local_files',
    'write_local_files',
    'network_outbound',
    'spawn_subprocess',
    'system_clock',
    'random_source',
  ])).default([]),

  binaryFormat: z.literal('wasm32-wasip2'),
  binarySizeBytes: z.number().int().min(0),

  sha256: z.string().regex(/^[0-9a-f]{64}$/),
  signedBy: z.string(),
  signedAt: z.string().datetime(),
});

export type ModuleManifest = z.infer<typeof ModuleManifestSchema>;
