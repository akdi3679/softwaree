import { z } from 'zod';
/**
 * A complete module package: manifest + binary + signatures.
 *
 * The binary is base64-encoded to fit in JSON. The Cloud returns this
 * over HTTPS. The Admin verifies, decrypts, and stores the binary.
 */
export declare const ModulePackageSchema: z.ZodObject<{
    manifest: z.ZodObject<{
        moduleId: z.ZodString;
        name: z.ZodString;
        version: z.ZodString;
        description: z.ZodString;
        minCoreVersion: z.ZodString;
        minAppVersion: z.ZodString;
        requiredPermissions: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        providedCommands: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        providedEvents: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        providedQueries: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        schemaMigrations: z.ZodArray<z.ZodObject<{
            version: z.ZodNumber;
            up: z.ZodString;
            down: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            version: number;
            up: string;
            down?: string | undefined;
        }, {
            version: number;
            up: string;
            down?: string | undefined;
        }>, "many">;
        capabilities: z.ZodDefault<z.ZodArray<z.ZodEnum<["read_local_files", "write_local_files", "network_outbound", "spawn_subprocess", "system_clock", "random_source"]>, "many">>;
        binaryFormat: z.ZodLiteral<"wasm32-wasip2">;
        binarySizeBytes: z.ZodNumber;
        sha256: z.ZodString;
        signedBy: z.ZodString;
        signedAt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        moduleId: string;
        name: string;
        version: string;
        description: string;
        minCoreVersion: string;
        minAppVersion: string;
        requiredPermissions: string[];
        providedCommands: string[];
        providedEvents: string[];
        providedQueries: string[];
        schemaMigrations: {
            version: number;
            up: string;
            down?: string | undefined;
        }[];
        capabilities: ("read_local_files" | "write_local_files" | "network_outbound" | "spawn_subprocess" | "system_clock" | "random_source")[];
        binaryFormat: "wasm32-wasip2";
        binarySizeBytes: number;
        sha256: string;
        signedBy: string;
        signedAt: string;
    }, {
        moduleId: string;
        name: string;
        version: string;
        description: string;
        minCoreVersion: string;
        minAppVersion: string;
        schemaMigrations: {
            version: number;
            up: string;
            down?: string | undefined;
        }[];
        binaryFormat: "wasm32-wasip2";
        binarySizeBytes: number;
        sha256: string;
        signedBy: string;
        signedAt: string;
        requiredPermissions?: string[] | undefined;
        providedCommands?: string[] | undefined;
        providedEvents?: string[] | undefined;
        providedQueries?: string[] | undefined;
        capabilities?: ("read_local_files" | "write_local_files" | "network_outbound" | "spawn_subprocess" | "system_clock" | "random_source")[] | undefined;
    }>;
    binary: z.ZodString;
    signatures: z.ZodObject<{
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
    packagingFormatVersion: z.ZodLiteral<1>;
}, "strip", z.ZodTypeAny, {
    manifest: {
        moduleId: string;
        name: string;
        version: string;
        description: string;
        minCoreVersion: string;
        minAppVersion: string;
        requiredPermissions: string[];
        providedCommands: string[];
        providedEvents: string[];
        providedQueries: string[];
        schemaMigrations: {
            version: number;
            up: string;
            down?: string | undefined;
        }[];
        capabilities: ("read_local_files" | "write_local_files" | "network_outbound" | "spawn_subprocess" | "system_clock" | "random_source")[];
        binaryFormat: "wasm32-wasip2";
        binarySizeBytes: number;
        sha256: string;
        signedBy: string;
        signedAt: string;
    };
    binary: string;
    signatures: {
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
    };
    packagingFormatVersion: 1;
}, {
    manifest: {
        moduleId: string;
        name: string;
        version: string;
        description: string;
        minCoreVersion: string;
        minAppVersion: string;
        schemaMigrations: {
            version: number;
            up: string;
            down?: string | undefined;
        }[];
        binaryFormat: "wasm32-wasip2";
        binarySizeBytes: number;
        sha256: string;
        signedBy: string;
        signedAt: string;
        requiredPermissions?: string[] | undefined;
        providedCommands?: string[] | undefined;
        providedEvents?: string[] | undefined;
        providedQueries?: string[] | undefined;
        capabilities?: ("read_local_files" | "write_local_files" | "network_outbound" | "spawn_subprocess" | "system_clock" | "random_source")[] | undefined;
    };
    binary: string;
    signatures: {
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
    };
    packagingFormatVersion: 1;
}>;
export type ModulePackage = z.infer<typeof ModulePackageSchema>;
//# sourceMappingURL=package.d.ts.map