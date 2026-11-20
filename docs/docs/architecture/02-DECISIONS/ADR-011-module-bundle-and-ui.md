# ADR-011: Module Bundle Format and UI Contract

**Status:** Accepted — amended 2026-11-20
**Date:** 2026-11-20
**Amended:** 2026-11-20 — post-module-update catch-up uses the `module_refresh` snapshot scope, not `partial`
**Deciders:** Architecture team
**See also:** ADR-006 (Wasmtime runtime), ADR-007 (signatures + encryption), ADR-012 (permissions + version negotiation), ADR-014 (licensing), ADR-015 (updates), ADR-022 (keys)

---

## Context

ADR-006 gave modules a sandboxed place to run **logic**. Nothing defined where a module's **screens** come from. If module pages are compiled into the app binary, then adding a module — or adding one page to an existing module — forces a full app release. That defeats the owner's stated goal of creating and shipping modules from the private channel.

Three related gaps also needed closing:

- Module content was signed but not encrypted, so a copied file was readable even if it would not verify.
- `device_bind` was described inconsistently across documents.
- Nothing defined what happens when the Admin and a User run different versions of the same module.

## Decision

A module ships as **one bundle** containing logic, UI, and proofs:

```
bundle/
├── manifest.json                  ← triple-signed (ADR-007)
├── manifest.sig.cloud_root
├── manifest.sig.project_license
├── manifest.sig.device_bind
├── cert_chain.pem
├── binary.wasm.enc                ← encrypted logic
└── ui/                            ← static, hashed UI assets
    ├── index.html
    ├── module.js
    ├── module.css
    └── assets/                    ← images/fonts, inlined at load time
```

The manifest fields, `bundle_hash`, and the three signatures are defined **once**, in ADR-007. This ADR defines the UI half and the compatibility rules.

---

## 1. The UI is data, not app code

Module UI is **static HTML + JS + CSS**, hashed in the signed manifest (`ui_sha256`). It is never compiled into the app binary. Adding a module or a page is a module release, not an app release.

Rules:
- No remote code. No CDN. No `import()` of anything outside the bundle. No `eval`, no `new Function`, no WASM compiled inside the UI.
- All assets are local to the bundle. Images and fonts are inlined as `data:` URIs at load time.
- The UI is **untrusted** even though it is signed. Signing proves origin, not safety. Every bridge call is authorised by the host (Principles 5 and 7).

## 2. The sandbox

The host renders the module UI in an **iframe with an opaque origin**:

```html
<iframe sandbox="allow-scripts" srcdoc="<host-generated boot document>"></iframe>
```

- `allow-scripts` only. **Never** `allow-same-origin` (that combination lets the frame remove its own sandbox). No `allow-forms`, `allow-popups`, `allow-top-navigation`, `allow-modals`.
- The host verifies every asset hash against `ui_sha256`, then inlines the verified JS and CSS into the boot document with a **fresh per-load nonce**.
- Opaque origin means: no cookies, no `localStorage`, no `IndexedDB`, no same-origin DOM access to the host app.

The boot document carries its CSP in a `<meta http-equiv>` tag:

```
default-src 'none';
script-src 'nonce-<per-load-random>';
style-src  'nonce-<per-load-random>';
img-src    data:;
font-src   data:;
connect-src 'none';
frame-src  'none';
form-action 'none';
base-uri   'none';
```

Consequences: the module UI cannot make network calls, cannot open frames, cannot submit forms, cannot load external anything. Inline `style="..."` attributes are forbidden (they would need `unsafe-inline`); all styling lives in the nonce'd stylesheet.

## 3. The bridge

The only channel between UI and host is `postMessage`, with a typed envelope:

```json
{
  "v": 1,
  "session": "<per-load-session-token>",
  "kind": "request",
  "id": "018f...uuidv7",
  "method": "query.list_patients",
  "payload": { "filter": { "name_starts_with": "A" }, "limit": 50 }
}
```

Host-side validation, in order:
1. `event.source === iframe.contentWindow` (identity check — an opaque origin serialises to `"null"`, so origin alone is not a valid check)
2. `session` matches the token issued for this load
3. Envelope matches the Zod schema for `v1`
4. `method` is in the allow-list derived from the manifest's declared capabilities
5. Payload matches the method's schema (structured filters only — never raw SQL, ADR-006)
6. Authorisation is re-checked against current permissions
7. Execute, return `{kind:"response", id, ok, result | error}`

Allow-listed method families:
- `query.<declared_query>` — reads the authorised projection (User) or authorised tables (Admin)
- `command.<declared_command>` — on Admin goes to the command handler; on User goes through the one-round-trip write path (ADR-012)
- `host.ui.toast`, `host.ui.navigate`, `host.ui.print`, `host.ui.close`
- `host.log`

Never exposed: `db.*`, `fs.*`, `net.*`, `key.*`, `audit.*`, `module.*`.

Limits: 1 MB per message, 100 messages/second, 20 in-flight requests, 10 s request timeout. Exceeding any limit closes the frame and logs a security event.

## 4. Host API versioning and compatibility

- `manifest.api_version` is the host API major version the module was built against.
- The host advertises its supported range. Major mismatch → **do not load**, show "This module needs a newer version of the app."
- `SyncHello` / `SyncAck` exchange `module_versions` between Admin and User (ADR-012, SYNC-PROTOCOL).

When a User's version of a module is incompatible with the Admin's:

| Direction | Behaviour |
|---|---|
| Admin newer, User older | Admin marks that module's events in each batch as explicitly skipped (`module_incompatible`). The cursor still advances to the batch range end — no silent gaps. The User shows "Module update required" and requests the new bundle. |
| User newer, Admin older | The User's commands for that module are rejected by the Admin with `ModuleVersionMismatch`. The User shows "Waiting for the Admin to update." |
| After the User updates | The Admin sends a snapshot with `scope: "module_refresh"` for that module (ADR-008), which **replaces that module's rows** — including wrapped resource keys (ADR-012 §5) — so the User catches up without a full rebuild and without disturbing other modules. |

A version mismatch is always a visible, named state. It is never silent divergence and never a crash.

## 5. Module lifecycle

| Step | Behaviour |
|---|---|
| Install | Full ADR-007 verification, then store under `projects/{id}/modules/{module}-{version}/`, register in `module_registry` |
| Load | Re-verify signatures, expiry, licence, module access, hashes; then instantiate Wasmtime and mount the UI frame |
| Update | New version installed alongside the old; schema/data migration per ADR-015; atomic switch of the active version; previous version retained for restore |
| Rollback | Restore the pre-update snapshot (ADR-015). **Never downgrade** schema or code in place. |
| Uninstall / licence revoked | Mark revoked in `module_registry`, delete the bundle and its unwrapped content key, close frames. Module tables are **retained and exportable** (Principle 14) but read-only. |

## 6. Honest limit

The client runs on the customer's machine. Encrypted content, three signatures, an opaque-origin iframe and a validated bridge raise the bar a long way: a copied bundle is inert, and a patched client still cannot decrypt content it holds no key for. But a determined attacker in full control of a device that legitimately holds a licence can read what that device can read. **This is a strong licensing and isolation gate, not unbreakable DRM.** We say so plainly and never claim otherwise.

---

## Consequences

### Positive
- New modules and new pages ship without an app release.
- One bundle format covers logic, UI, encryption and licensing — no side channels.
- The UI cannot reach the network, storage, keys, or the host DOM.
- Version skew is a named state with a defined recovery path.

### Negative
- The bridge is a real API surface and must be versioned, fuzzed and reviewed.
- Inlining assets at load time costs a few milliseconds and forbids inline style attributes.
- Two runtimes per module (Wasmtime + iframe) means two sets of limits to enforce.

### Neutral
- The same UI bundle runs on Admin and User; the host's capability grants differ.
- Modules may ship logic-only (`ui/` absent) — the slots exist in the format either way.

---

## Alternatives Considered

**Compile module pages into the app.** Simplest, fastest. Rejected: every module change becomes an app release, defeating the owner's module-authoring goal.

**`sandbox="allow-scripts allow-same-origin"`.** Convenient for asset loading. Rejected: that combination lets the frame strip its own sandbox — it is not a sandbox.

**Serve module UI from a custom protocol origin.** Cleaner asset loading. Rejected for v1: cross-origin fetch from an opaque-origin frame adds CORS complexity and a new protocol handler attack surface. srcdoc + nonce is smaller and auditable.

**Let module UI call the Cloud directly.** Rejected: the Cloud is not in the data path, and `connect-src 'none'` makes it structurally impossible.

**Skip UI sandboxing because the UI is signed.** Rejected: signing proves who published it, not that it is bug-free. Principle 7 applies to our own modules too.

**Use `partial` snapshot for module-update catch-up.** Rejected: `partial` is additive (grant backfill). A module update must *replace* that module's rows. Using `partial` would leave stale rows. Hence `module_refresh` (ADR-008).

---

## Enforcement

- CI rejects a bundle with any `ui/` file missing from `ui_sha256`, or with `eval`/`new Function`/remote URLs in the JS.
- The bridge dispatcher is the only path from a module frame to host code. No direct `window` access, no shared globals.
- The frame-mount function is the only path that builds the boot document; it always generates a fresh nonce and session token.
- Lint: no host method may be registered unless it appears in the manifest capability schema.
- Every rejected bridge call is logged with module id, version, method and reason.

### Tests
- [ ] Tampered UI asset → refused before mount
- [ ] Module UI attempts `fetch` → blocked by CSP, logged
- [ ] Module UI attempts `localStorage` → throws (opaque origin)
- [ ] Bridge message with wrong session token → rejected
- [ ] Bridge message from another window → rejected by `event.source` check
- [ ] Undeclared method → rejected
- [ ] Raw SQL in a filter payload → schema rejection
- [ ] 1 MB + 1 byte message → frame closed, security event logged
- [ ] Admin newer / User older → explicit `module_incompatible` skips, cursor advances, update prompt shown
- [ ] After module update → `module_refresh` snapshot replaces that module's rows and keys
- [ ] module_refresh does not touch other modules' rows
- [ ] Uninstalled module → bundle and content key gone, data still exportable