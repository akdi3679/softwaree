# @product/contracts

Shared TypeScript types, Zod schemas, and protocol definitions for the Product platform.

Consumed by:
- The Admin app (source of truth for project data)
- The User app (read-only projection)
- WASM modules (through the SDK)
- Third-party integrations (through the Cloud API)

## Install

    pnpm add @product/contracts

## What is here

- Branded IDs (ProjectId, UserId, DeviceId, EventId, CommandId)
- Command, Query, and Event envelopes
- Sync protocol frame types (v1)
- Plan definitions for the 4 subscription tiers
- Zod schemas for runtime validation
- Event registry (11 event types)
- Command catalog (9 command types)
- Feature flag evaluation helper

## Usage

### Event

    import { type EventEnvelope } from "@product/contracts/events";

### Command

    import { commandCatalog } from "@product/contracts/commands";
    const spec = commandCatalog.get("patient.create");

### Feature flag

    import { isFeatureEnabled } from "@product/contracts";
    const on = await isFeatureEnabled("v2.offline_writes", ctx, fetchFlag);

### Sync protocol

See docs/architecture/SYNC-PROTOCOL.md for the full wire format.

## Versioning

Changesets is used. Every PR that changes behaviour adds a changeset. See .changeset/README.md.

## Contributing

1. Read docs/architecture/01-PRINCIPLES.md
2. Run pnpm test
3. Add tests for any new type
4. Add a changeset

## License

MIT