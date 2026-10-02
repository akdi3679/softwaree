import type { CommandId } from '../identity/command-id';
import type { ProjectSequence } from '../version/project-sequence';

/**
 * The success result of a command execution.
 *
 * Returned by the handler after the command has been fully applied
 * (data changed, event emitted, audit written, outbox populated).
 *
 * - `commandId`: echoes the input command
 * - `resultingSequence`: the project sequence number after this command
 * - `result`: the typed result payload (aggregate IDs created, etc.)
 * - `durationMs`: how long the command took to execute
 */
export interface CommandResult<TResult> {
  readonly commandId: CommandId;
  readonly resultingSequence: ProjectSequence;
  readonly result: TResult;
  readonly durationMs: number;
}
