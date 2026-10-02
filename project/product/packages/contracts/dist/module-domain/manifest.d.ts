import { z } from 'zod';
/**
 * A module's manifest, signed by the Cloud's root signing key.
 *
 * The manifest describes what the module is, what it needs, what it provides.
 * The actual binary is in a separate `package` file.
 */
export declare const ModuleManifestSchema: z.ZodObject<{
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
export type ModuleManifest = z.infer<typeof ModuleManifestSchema>;
//# sourceMappingURL=manifest.d.ts.map