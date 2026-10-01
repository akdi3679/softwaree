# TASK ID: CONTRACT-017.2
# TITLE: Add contracts README
# STATUS: pending
# DEPENDENCIES: CONTRACT-017.1
# ALLOWED FILES: product/packages/contracts/README.md
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Add a README for the contracts package documenting what's in it and how to use it.

## REQUIRED IMPLEMENTATION

Create the file `product/packages/contracts/README.md`:

```markdown
# @product/contracts

Shared TypeScript types, Zod schemas, and brand primitives for the product platform.

This package is the single source of truth for data shapes shared between
the Admin app, User app, Cloud, and modules. Everything that crosses an
IPC or network boundary uses a type defined here.

## Contents

- `identity/` — Branded ID types (`ProjectId`, `UserId`, `DeviceId`, `SessionId`, `CommandId`, `EventId`) and the `Branded<TBrand, TValue>` helper
- `time/` — `Timestamp` and `DurationMillis`
- `version/` — `ProjectSequence` (bigint, monotonic), `AggregateVersion` (per-entity optimistic concurrency), `SchemaVersion`
- `errors/` — `ErrorCategory`, `ErrorContract`, `ValidationError`, `AuthorizationError`, `ConflictError`, `NetworkError`
- `results/` — `Result<T, E>` discriminated union, `ok()` / `err()` helpers
- `commands/` — `CommandEnvelope<TPayload>`, `CommandType`, `CommandPolicy`, `CommandDescriptor`, `CommandResult`
- `queries/` — `QueryEnvelope<TPayload>`, `QueryDescriptor`, `QueryResult`
- `events/` — `EventEnvelope<TPayload>`, `EventType`, `EventDescriptor`, `EventDeliveryRecord`, `Tombstone`
- `sync/` — `SyncPosition`, `SyncRequest`, `SyncResponse`, `SnapshotPayload`, `SyncConflict`, `SyncAck`, `SyncHello`
- `pagination/` — `PaginationRequest`, `Page<T>`
- `domain/` — `ProjectState`, `DeviceState`, `ModuleState`, `MembershipState`, `BackupState`
- `identity-domain/` — `Account`, `Device`, `Invitation`
- `project-domain/` — `Project`, `Membership`, `Role`, `Permission`, `RolePermission`
- `plan-domain/` — `Plan`, `PlanEntitlements`, `PlanSubscription`, `BUILT_IN_PLANS`
- `module-domain/` — `ModuleManifest`, `ModuleSignature`, `ModulePackage`, `ModuleRegistryEntry`

## Conventions

- All ID types are branded strings with a Zod schema that validates the format.
- Cross-type ID assignment is a type error (e.g., `ProjectId` is not assignable to `UserId`).
- Result types are used at every IPC/network boundary instead of throwing.
- All schemas have a corresponding TypeScript type via `z.infer<>`.
- Time types use ISO 8601 strings at the boundary, `Date` internally.
- All envelope types are generic over their payload (`EventEnvelope<TPayload>`).

## Development

```bash
# Type check
pnpm typecheck

# Run tests
pnpm test

# Lint
pnpm lint
```
```

## TESTS

```bash
cd product
test -f packages/contracts/README.md || { echo "FAIL"; exit 1; }
echo "OK"
```
