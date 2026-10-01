# TASK ID: CONTRACT-016.1
# TITLE: Define ModuleManifest
# STATUS: pending
# DEPENDENCIES: CONTRACT-015.4
# ALLOWED FILES: product/packages/contracts/src/module-domain/manifest.ts, product/packages/contracts/src/module-domain/index.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Define `ModuleManifest` — the signed descriptor of a module package.

## REQUIRED IMPLEMENTATION

```bash
mkdir -p product/packages/contracts/src/module-domain
```

Create the file `product/packages/contracts/src/module-domain/manifest.ts`:

```typescript
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

  // Compatibility
  minCoreVersion: z.string().regex(/^\d+\.\d+\.\d+$/),
  minAppVersion: z.string().regex(/^\d+\.\d+\.\d+$/),

  // Required permissions (declared, not yet granted)
  requiredPermissions: z.array(z.string()).default([]),

  // Commands and events this module registers
  providedCommands: z.array(z.string()).default([]),
  providedEvents: z.array(z.string()).default([]),
  providedQueries: z.array(z.string()).default([]),

  // Database schema this module requires
  schemaMigrations: z.array(z.object({
    version: z.number().int().min(1),
    up: z.string(), // SQL or migration name
    down: z.string().optional(),
  })),

  // Capabilities the module needs (filesystem, network, etc.)
  capabilities: z.array(z.enum([
    'read_local_files',
    'write_local_files',
    'network_outbound',
    'spawn_subprocess',
    'system_clock',
    'random_source',
  ])).default([]),

  // Binary info
  binaryFormat: z.literal('wasm32-wasip2'),
  binarySizeBytes: z.number().int().min(0),

  // Signature
  sha256: z.string().regex(/^[0-9a-f]{64}$/),
  signedBy: z.string(), // public key id
  signedAt: z.string().datetime(),
});

export type ModuleManifest = z.infer<typeof ModuleManifestSchema>;
```

Create `product/packages/contracts/src/module-domain/index.ts`:

```typescript
export type { ModuleManifest } from './manifest';
export { ModuleManifestSchema } from './manifest';
```

## TESTS

```bash
cd product
test -f packages/contracts/src/module-domain/manifest.ts || { echo "FAIL"; exit 1; }
grep -q "minCoreVersion" packages/contracts/src/module-domain/manifest.ts || { echo "FAIL"; exit 1; }
pnpm --filter @product/contracts typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
