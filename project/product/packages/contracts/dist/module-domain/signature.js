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
        signature: z.string().min(1),
        publicKey: z.string().min(1),
        algorithm: z.literal('ed25519'),
        signedAt: z.string().datetime(),
    }),
    projectLicense: z.object({
        signature: z.string().min(1),
        projectId: z.string(),
        planId: z.string(),
        expiresAt: z.string().datetime().optional(),
        algorithm: z.literal('ed25519'),
        signedAt: z.string().datetime(),
    }),
    deviceBind: z.object({
        signature: z.string().min(1),
        deviceId: z.string(),
        algorithm: z.literal('hmac-sha256'),
        signedAt: z.string().datetime(),
    }),
});
//# sourceMappingURL=signature.js.map