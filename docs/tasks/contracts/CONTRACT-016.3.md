# TASK ID: CONTRACT-016.3
# TITLE: Define ModulePackage
# STATUS: pending
# DEPENDENCIES: CONTRACT-016.2
# ALLOWED FILES: product/packages/contracts/src/module-domain/package.ts, product/packages/contracts/src/module-domain/index.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Define `ModulePackage` — the full signed bundle delivered to the Admin.

## REQUIRED IMPLEMENTATION

Create the file `product/packages/contracts/src/module-domain/package.ts`:

```typescript
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
  binary: z.string().min(1), // base64-encoded wasm
  signatures: ModuleSignatureSchema,
  packagingFormatVersion: z.literal(1),
});

export type ModulePackage = z.infer<typeof ModulePackageSchema>;
```

Update `product/packages/contracts/src/module-domain/index.ts` to add exports.

## TESTS

```bash
cd product
test -f packages/contracts/src/module-domain/package.ts || { echo "FAIL"; exit 1; }
grep -q "ModulePackage" packages/contracts/src/module-domain/package.ts || { echo "FAIL"; exit 1; }
pnpm --filter @product/contracts typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
