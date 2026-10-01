# TASK ID: LAUNCH-025.1
# TITLE: Add: open-source the contracts package README
# STATUS: pending
# DEPENDENCIES: LAUNCH-024.2
# ALLOWED FILES: product/contracts/README.md
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Public-facing README for the contracts package. Community can build modules.

## REQUIRED IMPLEMENTATION

Create `product/contracts/README.md`:

```markdown
# @product/contracts

The shared types and protocols for the Product platform.

Used by:
- The Admin app (source of truth for project data)
- The User app (read-only viewer)
- Modules (write to the event stream)
- Third-party integrations (read events, send commands)

## What is here

- **Branded IDs** (e.g. `ProjectId`, `UserId`, `DeviceId`) — type-safe strings
- **Envelopes** for commands, queries, and events
- **Sync protocol** (v1) — how Admin and User exchange data
- **Plan definitions** — the 4 subscription tiers
- **Zod schemas** for runtime validation
- **Feature flag** evaluation
- **OpenAPI** spec for the Cloud HTTP API
- **TypeScript SDK** for the Cloud API

## Install

```bash
npm install @product/contracts
# or
pnpm add @product/contracts
```

## Use

### Send a command

```typescript
import { CommandEnvelope, type ProjectId } from '@product/contracts';

const cmd: CommandEnvelope<PatientCreatePayload> = {
  id: crypto.randomUUID(),
  command_type: 'patient.create',
  actor_id: 'usr_...',
  device_id: 'dev_...',
  project_id: projectId as ProjectId,
  payload: {
    full_name: 'John Doe',
    phone: '555-1234',
    date_of_birth: '1990-01-01',
    gender: 'male',
  },
  idempotency_key: crypto.randomUUID(),
  occurred_at: new Date().toISOString(),
};
```

### Verify a sync frame

```typescript
import { verifySyncFrame } from '@product/contracts/sync';
const isValid = await verifySyncFrame(frame, adminPublicKey);
```

### Call the Cloud API

```typescript
import { CloudClient } from '@product/contracts/sdk';
const client = new CloudClient('https://api.example.com', sessionToken);
const { projects } = await client.listProjects();
```

## Build a module

See `product/modules/sdk/README.md` for the full guide.

## Protocol v1

The sync protocol is in `/docs/architecture/SYNC-PROTOCOL.md`. v1 is the
only supported version. v2 is in design.

## Contributing

Issues and PRs welcome. Before opening a PR:
1. Read `/docs/architecture/01-PRINCIPLES.md`
2. Check the contract tests pass: `pnpm test`
3. Add tests for any new types

## License

MIT (the types, protocols, and SDK code).
```

## TESTS

```bash
cd /workspace
test -f product/contracts/README.md || { echo "FAIL"; exit 1; }
grep -q "@product/contracts" product/contracts/README.md || { echo "FAIL"; exit 1; }
echo "OK"
```
