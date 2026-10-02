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
export const ModuleState = {
  DISCOVERED: 'discovered',
  DOWNLOADED: 'downloaded',
  VERIFIED: 'verified',
  INSTALLED: 'installed',
  ENABLED: 'enabled',
  DISABLED: 'disabled',
  UNINSTALLED: 'uninstalled',
} as const;

export type ModuleState = (typeof ModuleState)[keyof typeof ModuleState];

export const ModuleStateSchema = z.nativeEnum(ModuleState);
