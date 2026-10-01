# TASK ID: CONTRACT-016.2
# TITLE: Define ModuleSignature
# STATUS: pending
# DEPENDENCIES: CONTRACT-016.1
# ALLOWED FILES: product/packages/contracts/src/module-domain/signature.ts, product/packages/contracts/src/module-domain/index.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Define the triple-signature structure for a module package.

## REQUIRED IMPLEMENTATION

Create the file `product/packages/contracts/src/module-domain/signature.ts`:

```typescript
import { z } from 'zod';

/**
 * The triple-signature structure on a module package.
 *
 * All three signatures must verify before the module can run.
 *
 * - cloud_root: signed by platform-cloud's root signing key (proves authenticity)
 * - project_license: signed by the per-project license key (proves project is licensed)
 * - device_bind: MAC'd with a key bound to the specific admin device
 */
export const ModuleSignatureSchema = z.object({
  cloudRoot: z.object({
    signature: z.string().min(1), // base64 ed25519 signature
    publicKey: z.string().min(1), // base64 ed25519 public key
    algorithm: z.literal('ed25519'),
    signedAt: z.string().datetime(),
  }),
  projectLicense: z.object({
    signature: z.string().min(1),
    projectId: z.string(), // the project this license is for
    planId: z.string(),
    expiresAt: z.string().datetime().optional(),
    algorithm: z.literal('ed25519'),
    signedAt: z.string().datetime(),
  }),
  deviceBind: z.object({
    signature: z.string().min(1), // MAC over (cloudRoot || projectLicense)
    deviceId: z.string(),
    algorithm: z.literal('hmac-sha256'),
    signedAt: z.string().datetime(),
  }),
});

export type ModuleSignature = z.infer<typeof ModuleSignatureSchema>;
```

Update `product/packages/contracts/src/module-domain/index.ts` to add exports.

## TESTS

```bash
cd product
test -f packages/contracts/src/module-domain/signature.ts || { echo "FAIL"; exit 1; }
grep -q "cloudRoot" packages/contracts/src/module-domain/signature.ts || { echo "FAIL"; exit 1; }
pnpm --filter @product/contracts typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
