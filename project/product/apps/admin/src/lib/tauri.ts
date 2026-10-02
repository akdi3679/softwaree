import { invoke } from '@tauri-apps/api/core';

/**
 * Typed wrapper around Tauri's invoke.
 * Use this to call backend commands from the frontend.
 */
export async function api<T>(
  command: string,
  args?: Record<string, unknown>,
): Promise<T> {
  return invoke<T>(command, args);
}
