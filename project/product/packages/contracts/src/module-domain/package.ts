import { z } from 'zod';
import { ModuleManifestSchema } from './manifest';
import { ModuleSignatureSchema } from './signature';

/**
 * A complete module package: manifest + binary + signatures.
 *
 * The binary is base64-encoded to fit in JSON. The Cloud returns this
 * over HTTPS. The Admin verifies, decrypts, and stores the binary.
 */
export const ModulePackageSchema = z.object({
  manifest: ModuleManifestSchema,
  binary: z.string().min(1),
  signatures: ModuleSignatureSchema,
  packagingFormatVersion: z.literal(1),
});

export type ModulePackage = z.infer<typeof ModulePackageSchema>;
