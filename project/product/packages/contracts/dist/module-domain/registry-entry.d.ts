import { z } from 'zod';
/**
 * A module's installation record within a project.
 *
 * The Admin keeps one of these per (project, module_id).
 * Tied to a specific version � upgrading creates a new entry.
 */
export declare const ModuleRegistryEntrySchema: z.ZodObject<{
    entryId: z.ZodString;
    projectId: z.ZodBranded<z.ZodString, "ProjectId">;
    moduleId: z.ZodString;
    version: z.ZodString;
    state: z.ZodNativeEnum<{
        readonly DISCOVERED: "discovered";
        readonly DOWNLOADED: "downloaded";
        readonly VERIFIED: "verified";
        readonly INSTALLED: "installed";
        readonly ENABLED: "enabled";
        readonly DISABLED: "disabled";
        readonly UNINSTALLED: "uninstalled";
    }>;
    installedAt: z.ZodBranded<z.ZodDate, "Timestamp">;
    installedByUserId: z.ZodBranded<z.ZodString, "UserId">;
    installedByDeviceId: z.ZodBranded<z.ZodString, "DeviceId">;
    binaryPath: z.ZodString;
    schemaVersion: z.ZodNumber;
    licenseExpiresAt: z.ZodOptional<z.ZodBranded<z.ZodDate, "Timestamp">>;
    lastVerifiedAt: z.ZodOptional<z.ZodBranded<z.ZodDate, "Timestamp">>;
}, "strip", z.ZodTypeAny, {
    projectId: string & z.BRAND<"ProjectId">;
    state: "discovered" | "downloaded" | "verified" | "installed" | "enabled" | "disabled" | "uninstalled";
    moduleId: string;
    version: string;
    entryId: string;
    installedAt: Date & z.BRAND<"Timestamp">;
    installedByUserId: string & z.BRAND<"UserId">;
    installedByDeviceId: string & z.BRAND<"DeviceId">;
    binaryPath: string;
    schemaVersion: number;
    licenseExpiresAt?: (Date & z.BRAND<"Timestamp">) | undefined;
    lastVerifiedAt?: (Date & z.BRAND<"Timestamp">) | undefined;
}, {
    projectId: string;
    state: "discovered" | "downloaded" | "verified" | "installed" | "enabled" | "disabled" | "uninstalled";
    moduleId: string;
    version: string;
    entryId: string;
    installedAt: Date;
    installedByUserId: string;
    installedByDeviceId: string;
    binaryPath: string;
    schemaVersion: number;
    licenseExpiresAt?: Date | undefined;
    lastVerifiedAt?: Date | undefined;
}>;
export type ModuleRegistryEntry = z.infer<typeof ModuleRegistryEntrySchema>;
//# sourceMappingURL=registry-entry.d.ts.map