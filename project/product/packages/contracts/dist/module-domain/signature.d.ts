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
export declare const ModuleSignatureSchema: z.ZodObject<{
    cloudRoot: z.ZodObject<{
        signature: z.ZodString;
        publicKey: z.ZodString;
        algorithm: z.ZodLiteral<"ed25519">;
        signedAt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        publicKey: string;
        signedAt: string;
        signature: string;
        algorithm: "ed25519";
    }, {
        publicKey: string;
        signedAt: string;
        signature: string;
        algorithm: "ed25519";
    }>;
    projectLicense: z.ZodObject<{
        signature: z.ZodString;
        projectId: z.ZodString;
        planId: z.ZodString;
        expiresAt: z.ZodOptional<z.ZodString>;
        algorithm: z.ZodLiteral<"ed25519">;
        signedAt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        projectId: string;
        signedAt: string;
        signature: string;
        algorithm: "ed25519";
        planId: string;
        expiresAt?: string | undefined;
    }, {
        projectId: string;
        signedAt: string;
        signature: string;
        algorithm: "ed25519";
        planId: string;
        expiresAt?: string | undefined;
    }>;
    deviceBind: z.ZodObject<{
        signature: z.ZodString;
        deviceId: z.ZodString;
        algorithm: z.ZodLiteral<"hmac-sha256">;
        signedAt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        deviceId: string;
        signedAt: string;
        signature: string;
        algorithm: "hmac-sha256";
    }, {
        deviceId: string;
        signedAt: string;
        signature: string;
        algorithm: "hmac-sha256";
    }>;
}, "strip", z.ZodTypeAny, {
    cloudRoot: {
        publicKey: string;
        signedAt: string;
        signature: string;
        algorithm: "ed25519";
    };
    projectLicense: {
        projectId: string;
        signedAt: string;
        signature: string;
        algorithm: "ed25519";
        planId: string;
        expiresAt?: string | undefined;
    };
    deviceBind: {
        deviceId: string;
        signedAt: string;
        signature: string;
        algorithm: "hmac-sha256";
    };
}, {
    cloudRoot: {
        publicKey: string;
        signedAt: string;
        signature: string;
        algorithm: "ed25519";
    };
    projectLicense: {
        projectId: string;
        signedAt: string;
        signature: string;
        algorithm: "ed25519";
        planId: string;
        expiresAt?: string | undefined;
    };
    deviceBind: {
        deviceId: string;
        signedAt: string;
        signature: string;
        algorithm: "hmac-sha256";
    };
}>;
export type ModuleSignature = z.infer<typeof ModuleSignatureSchema>;
//# sourceMappingURL=signature.d.ts.map