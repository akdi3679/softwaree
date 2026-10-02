import type { z } from 'zod';
import type { CommandPolicy } from './policy';

/**
 * Metadata for a specific command type. Modules and core register
 * commands by providing a descriptor.
 *
 * - `commandType`: unique identifier (e.g., "patient.create")
 * - `payloadSchema`: Zod schema validating the payload
 * - `resultSchema`: Zod schema validating the success result
 * - `policy`: where the command can be processed
 * - `requiredPermission`: the permission required to execute
 * - `version`: command API version (for backwards compatibility)
 */
export interface CommandDescriptor<TPayload, TResult> {
  readonly commandType: string;
  readonly version: number;
  readonly payloadSchema: z.ZodType<TPayload>;
  readonly resultSchema: z.ZodType<TResult>;
  readonly policy: CommandPolicy;
  readonly requiredPermission: string;
  readonly description: string;
}
