# TASK ID: ARCH-014.1
# TITLE: Add architecture: API versioning policy
# STATUS: pending
# DEPENDENCIES: CLOUD-019.2
# ALLOWED FILES: docs/architecture/API-VERSIONING.md
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
When to break the API, when not to.

## REQUIRED IMPLEMENTATION

Create `docs/architecture/API-VERSIONING.md`:

```markdown
# API Versioning Policy

## Public API

The Cloud HTTP API is versioned in the URL: `/v1/...`, `/v2/...`.

The sync protocol between Admin and User is versioned in the `SyncHello`
frame: `protocol_version=1`.

## Compatibility rules

### Backwards-compatible changes (don't bump version)
- Adding new endpoints
- Adding new optional fields to request/response
- Adding new query parameters (with sensible defaults)
- Adding new error codes
- Adding new event types
- Adding new fields to events (with defaults)

### Breaking changes (bump version)
- Removing endpoints
- Removing fields
- Changing field types
- Making optional fields required
- Renaming fields
- Changing error semantics

## Process

1. **All changes are backwards-compatible by default**. If a breaking
   change is needed, it's an ADR.
2. **Deprecation warnings**: when a field is deprecated, we add
   `X-Deprecation-Notice: field X will be removed on YYYY-MM-DD` header
   for 6 months.
3. **Sunset**: removed 12 months after deprecation.
4. **All versions supported**: N-1, N-2 always.

## Per-version support

| Version | Status | Sunset |
|---|---|---|
| v1 | Current | TBD |
| v0 | Deprecated (old beta) | 2026-12-31 |

## Sync protocol

`SyncHello.protocol_version` must match a supported version.
On version mismatch:
- Admin and User fail to connect
- Both show a "please update" message
- User can download the latest from our website

## Modules

Module manifest version is in `manifest.schema_version`. We support
backwards-compat: a v2 module runs on a v1 Admin with reduced features,
and a v1 module runs on a v2 Admin unchanged.
```

## TESTS

```bash
cd /workspace
test -f docs/architecture/API-VERSIONING.md || { echo "FAIL"; exit 1; }
grep -q "sync" docs/architecture/API-VERSIONING.md || { echo "FAIL"; exit 1; }
echo "OK"
```
