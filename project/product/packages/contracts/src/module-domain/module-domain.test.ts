import { describe, expect, it } from 'vitest';
import { ModuleManifestSchema, ModulePackageSchema, ModuleSignatureSchema } from './index';

describe('ModuleManifestSchema', () => {
  it('requires semver version', () => {
    const r = ModuleManifestSchema.safeParse({
      moduleId: 'medical-reception',
      name: 'Medical Reception',
      version: '1.0.0',
      description: '',
      minCoreVersion: '2.0.0',
      minAppVersion: '1.4.0',
      requiredPermissions: [],
      providedCommands: [],
      providedEvents: [],
      providedQueries: [],
      schemaMigrations: [],
      capabilities: [],
      binaryFormat: 'wasm32-wasip2',
      binarySizeBytes: 1024,
      sha256: 'a'.repeat(64),
      signedBy: 'key_1',
      signedAt: new Date().toISOString(),
    });
    expect(r.success).toBe(true);
  });
});

describe('ModuleSignatureSchema', () => {
  it('requires all three signatures', () => {
    const r = ModuleSignatureSchema.safeParse({});
    expect(r.success).toBe(false);
  });
});
