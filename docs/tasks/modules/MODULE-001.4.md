# TASK ID: MODULE-001.4
# TITLE: Add module signing service in Cloud
# STATUS: pending
# DEPENDENCIES: MODULE-001.3
# ALLOWED FILES: platform-cloud/src/modules/signer.ts, platform-cloud/src/modules/routes.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
Cloud signs a published module binary with the cloud_root key.

## REQUIRED IMPLEMENTATION

Create `platform-cloud/src/modules/signer.ts`:

```typescript
import { createHash } from 'node:crypto';
import { ed25519 } from '@noble/curves/ed25519';
import { base64UrlNoPadEncode, nowIso8601 } from '../crypto/utils';
import type { ModuleManifest, ModuleSignature, ModulePackage } from '@product/contracts';

const CLOUD_ROOT_KEY_HEX = process.env.CLOUD_ROOT_PRIVATE_KEY ?? '';

if (!CLOUD_ROOT_KEY_HEX) {
  console.warn('CLOUD_ROOT_PRIVATE_KEY not set — module signing will fail');
}

export interface SignedModule {
  manifest: ModuleManifest;
  signatures: ModuleSignature;
  binary: string; // base64
}

/**
 * Sign a module. Returns the full signed package.
 * 1. cloud_root: signs (sha256 || manifest_json)
 * 2. project_license: signs (projectId || planId || sha256) — placeholder for project-specific signing
 */
export function signModule(
  manifest: ModuleManifest,
  binary: Buffer,
  projectId: string,
  planId: string,
): SignedModule {
  // Recompute sha256 to make sure the manifest matches
  const sha256 = createHash('sha256').update(binary).digest('hex');
  if (sha256 !== manifest.sha256) {
    throw new Error(`SHA-256 mismatch: expected ${manifest.sha256}, got ${sha256}`);
  }

  const manifestJson = JSON.stringify(manifest);
  const cloudRootMsg = Buffer.concat([Buffer.from(sha256, 'utf8'), Buffer.from(manifestJson, 'utf8')]);
  const cloudRootSig = ed25519.sign(cloudRootMsg, CLOUD_ROOT_KEY_HEX);
  const cloudRootPub = ed25519.getPublicKey(CLOUD_ROOT_KEY_HEX);

  // Project-license signature uses the same cloud key in v1 (per-project keys in v2)
  const licenseMsg = Buffer.from(`${projectId}${planId}${sha256}`, 'utf8');
  const licenseSig = ed25519.sign(licenseMsg, CLOUD_ROOT_KEY_HEX);

  const signatures: ModuleSignature = {
    cloud_root: {
      signature: Buffer.from(cloudRootSig).toString('hex'),
      public_key: Buffer.from(cloudRootPub).toString('hex'),
      algorithm: 'ed25519',
      signed_at: nowIso8601(),
    },
    project_license: {
      signature: Buffer.from(licenseSig).toString('hex'),
      project_id: projectId,
      plan_id: planId,
      algorithm: 'ed25519',
      signed_at: nowIso8601(),
    },
    device_bind: {
      // Filled in by the Admin when it derives the device MAC
      signature: '',
      device_id: '',
      algorithm: 'ed25519',
      signed_at: nowIso8601(),
    },
  };

  return {
    manifest,
    signatures,
    binary: binary.toString('base64'),
  };
}
```

Create `platform-cloud/src/modules/routes.ts`:

```typescript
import { Hono } from 'hono';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { modules as modulesTable, moduleVersions } from '../db/schema';
import { signModule } from './signer';
import { ModuleManifestSchema } from '@product/contracts';

const PublishModuleSchema = z.object({
  module_id: z.string(),
  version: z.string(),
  binary: z.string(), // base64
  description: z.string().optional(),
  min_core_version: z.string().default('0.1.0'),
  min_app_version: z.string().default('0.1.0'),
  required_permissions: z.array(z.string()).default([]),
  provided_commands: z.array(z.string()).default([]),
  provided_events: z.array(z.string()).default([]),
  provided_queries: z.array(z.string()).default([]),
  capabilities: z.array(z.string()).default([]),
});

export const moduleRoutes = new Hono()
  .post('/v1/modules', async (c) => {
    const body = PublishModuleSchema.parse(await c.req.json());
    const binary = Buffer.from(body.binary, 'base64');
    const sha256 = (await import('node:crypto')).createHash('sha256').update(binary).digest('hex');

    // Build a manifest skeleton
    const manifest = {
      module_id: body.module_id,
      name: body.module_id, // overwritten by editor
      version: body.version,
      description: body.description ?? '',
      min_core_version: body.min_core_version,
      min_app_version: body.min_app_version,
      required_permissions: body.required_permissions,
      provided_commands: body.provided_commands,
      provided_events: body.provided_events,
      provided_queries: body.provided_queries,
      capabilities: body.capabilities,
      binary_format: 'wasm32-wasip2' as const,
      binary_size_bytes: binary.length,
      sha256,
      signed_by: 'cloud_root',
      signed_at: new Date().toISOString(),
    };
    const parsed = ModuleManifestSchema.parse(manifest);

    // Insert into DB
    const existing = await db.select().from(modulesTable).where(eq(modulesTable.moduleId, parsed.module_id));
    let moduleRowId: string;
    if (existing.length === 0) {
      const inserted = await db.insert(modulesTable).values({
        moduleId: parsed.module_id,
        name: parsed.name,
        description: parsed.description,
        requiredPermissions: parsed.required_permissions,
        providedCommands: parsed.provided_commands,
        providedEvents: parsed.provided_events,
        providedQueries: parsed.provided_queries,
        publishedAt: new Date().toISOString(),
      }).returning();
      moduleRowId = inserted[0].id;
    } else {
      moduleRowId = existing[0].id;
    }

    // Sign + insert version
    const signed = signModule(parsed, binary, 'placeholder', 'placeholder');
    await db.insert(moduleVersions).values({
      moduleId: moduleRowId,
      version: parsed.version,
      sha256,
      sizeBytes: parsed.binary_size_bytes,
      manifestJson: JSON.stringify(parsed),
      binary: body.binary,
      signatures: JSON.stringify(signed.signatures),
      publishedAt: new Date().toISOString(),
    });

    return c.json({ module_id: parsed.module_id, version: parsed.version, sha256 }, 201);
  })
  .get('/v1/modules', async (c) => {
    const rows = await db.select().from(modulesTable);
    return c.json({ modules: rows.map((r) => ({ module_id: r.moduleId, name: r.name, description: r.description })) });
  })
  .get('/v1/modules/:id/versions/:v/package', async (c) => {
    const { id, v } = c.req.param();
    const rows = await db.select({
        moduleId: modulesTable.moduleId,
        name: modulesTable.name,
      })
      .from(modulesTable)
      .where(eq(modulesTable.moduleId, id))
      .limit(1);
    if (rows.length === 0) return c.json({ error: 'not_found' }, 404);

    const versions = await db.select().from(moduleVersions)
      .where(eq(moduleVersions.version, v))
      .limit(1);
    if (versions.length === 0) return c.json({ error: 'version_not_found' }, 404);

    const ver = versions[0];
    return c.json({
      manifest: JSON.parse(ver.manifestJson),
      binary: ver.binary,
      signatures: JSON.parse(ver.signatures),
    });
  });
```

## TESTS

```bash
cd platform-cloud
test -f src/modules/signer.ts || { echo "FAIL"; exit 1; }
test -f src/modules/routes.ts || { echo "FAIL: no routes"; exit 1; }
grep -q "signModule" src/modules/signer.ts || { echo "FAIL"; exit 1; }
pnpm typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
