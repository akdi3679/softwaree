# TASK ID: CONTRACT-007.5
# TITLE: Define CommandResult
# STATUS: pending
# DEPENDENCIES: CONTRACT-007.4
# ALLOWED FILES: product/packages/contracts/src/commands/result.ts, product/packages/contracts/src/commands/index.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Define `CommandResult<T>` — the success result wrapper for a command execution.

## REQUIRED IMPLEMENTATION

Create the file `product/packages/contracts/src/commands/result.ts`:

```typescript
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
```

Update `product/packages/contracts/src/commands/index.ts` to add the export.

## ACCEPTANCE CRITERIA
- [ ] File exists
- [ ] `CommandResult<TResult>` is generic
- [ ] Has commandId, resultingSequence, result, durationMs

## TESTS

```bash
cd product
test -f packages/contracts/src/commands/result.ts || { echo "FAIL"; exit 1; }
grep -q "CommandResult" packages/contracts/src/commands/result.ts || { echo "FAIL: no result type"; exit 1; }
pnpm --filter @product/contracts typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
