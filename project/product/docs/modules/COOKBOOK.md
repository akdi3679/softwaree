# Module cookbook

Common patterns for module authors.

## Validate a payload

```rust
#[derive(Deserialize)]
struct CreateThing { name: String, amount: u32 }

let req: CreateThing = serde_json::from_value(cmd.payload.clone())
    .map_err(|e| ModuleError::Validation(e.to_string()))?;
```

## Emit multiple events

```rust
return Ok(CommandOutcome {
    events: vec![event1, event2, event3],
    response: json!({ "count": 3 }),
});
```

## Idempotency

Every command carries `idempotency_key`. Store the produced aggregate_id
under `(command_type, key)` and short-circuit on replay - see
`medical-reception/src/idempotency.rs`.

## Return an error

```rust
return Err(ModuleError::Validation("full_name is required".into()));
```

## Current time

Modules receive no ambient clock. The host exposes it (see
`modules/sdk/wit/product.wit` interface `host.now-iso8601`). Until the
host is wired, use `chrono::Utc::now()` directly.

## Unique IDs

Use the `new_id(prefix)` helper in each module helpers.rs file. It
formats as `<prefix>_<uuid4>`.

## What a module cannot do

- Make network calls
- Read files outside its sandbox
- Fork processes
- Talk to other modules
- Write to the audit log directly (host-mediated only)

If you need any of these, file a request on the publisher dashboard.
