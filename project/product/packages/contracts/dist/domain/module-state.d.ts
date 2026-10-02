import { z } from 'zod';
/**
 * Module lifecycle states (per project).
 *
 *  DISCOVERED ? DOWNLOADED ? VERIFIED ? INSTALLED ? ENABLED ? (DISABLED | UNINSTALLED)
 *
 * - DISCOVERED: module available in registry, not yet downloaded
 * - DOWNLOADED: Admin has the package locally
 * - VERIFIED: signatures checked, integrity confirmed
 * - INSTALLED: schema applied, registered in module_registry table
 * - ENABLED: runtime loaded, accepting commands
 * - DISABLED: runtime not loaded, but still in registry (can be re-enabled)
 * - UNINSTALLED: removed from registry (terminal)
 */
export declare const ModuleState: {
    readonly DISCOVERED: "discovered";
    readonly DOWNLOADED: "downloaded";
    readonly VERIFIED: "verified";
    readonly INSTALLED: "installed";
    readonly ENABLED: "enabled";
    readonly DISABLED: "disabled";
    readonly UNINSTALLED: "uninstalled";
};
export type ModuleState = (typeof ModuleState)[keyof typeof ModuleState];
export declare const ModuleStateSchema: z.ZodNativeEnum<{
    readonly DISCOVERED: "discovered";
    readonly DOWNLOADED: "downloaded";
    readonly VERIFIED: "verified";
    readonly INSTALLED: "installed";
    readonly ENABLED: "enabled";
    readonly DISABLED: "disabled";
    readonly UNINSTALLED: "uninstalled";
}>;
//# sourceMappingURL=module-state.d.ts.map