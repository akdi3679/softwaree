# ADR-011: Module Bundle Format and UI Contract

**Status:** Accepted — amended 2026-11-20 (review pass 2)
**Date:** 2026-11-20
**Amended:** HostClient interface added, Phase 0 CSP spike for srcdoc iframe, bundle format aligned with ADR-007 split
**Deciders:** Architecture team
**See also:** ADR-006 (runtime), ADR-007 (signatures), ADR-012 (permissions), ADR-014 (licensing)

---

## Context

ADR-006 gave modules a sandboxed place to run **logic**. Nothing defined where a module's **screens** come from. If module pages are compiled into the app binary, then adding a module or a page forces a full app release. That defeats the owner's stated goal of creating and shipping modules from the private channel.

Furthermore, the UI port in Phase 5 would call `invoke()` directly, but from Phase 6b the UI runs in a sandboxed iframe with no Tauri access and
`connect-src 'none'`, so only `postMessage` works. Without an abstraction layer, the entire UI would need to be rewritten in Phase 6b.

## Decision

### 1. The HostClient Interface

All module UI pages are written against a **HostClient** interface, not directly against Tauri's `invoke()`:

```typescript

interface CommandOpts {
  idempotencyKey: string;      // UUIDv7, required — Principle 6
  expectedVersion?: number;    // optimistic concurrency — ADR-004
}
interface BlobHandle { id: string; sha256: string; bytes: number; mime: string }
interface HostClient {
  query<T>(name: string, payload: unknown): Promise<T>;
  command<T>(name: string, payload: unknown, opts: CommandOpts): Promise<T>;
  openBlob(handle: BlobHandle): Promise<void>;     // host viewer, outside the iframe
  uploadBlob(file: File): Promise<BlobHandle>;     // chunked ≤256 KB inside the adapter
  ui: {
    toast(message: string): void;
    navigate(route: string): void;
    print(handle?: BlobHandle): Promise<void>;
    close(): void;
  };
  log(entry: unknown): void;
}
```

`idempotencyKey` is mandatory in the signature, not optional: without it the bridge cannot satisfy Principle 6, and every page would need rewriting when retries are wired. CI asserts no module UI file imports `@tauri-apps/api` — only the adapter may.

Two adapters implement this interface:

- **Tauri adapter (Phases 3–6a, development):** calls `invoke()` directly. Used during development and before Wasmtime extraction.
- **Bridge adapter (Phase 6b, production):** uses `postMessage` over the typed bridge to the host. Used when the module UI runs in a sandboxed iframe.

This means the same React pages work in both contexts. No rewrite in Phase 6b.

### 2. Module UI is data, not app code

Module UI is **static HTML + JS + CSS**, hashed in the signed manifest (`ui_sha256`). It is never compiled into the app binary. Adding a module or a page is a module release, not an app release.

Rules:
- No remote code. No CDN. No `import()` of anything outside the bundle. No `eval`, no `new Function`, no WASM compiled inside the UI.
- All assets are local to the bundle. Images and fonts are inlined as `data:` URIs at load time.
- The UI is **untrusted** even though it is signed. Signing proves origin, not safety. Every bridge call is authorised by the host (Principles 5 and 7).

### 3. The sandbox

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
style-src-attr 'unsafe-inline';
img-src    data:;
font-src   data:;
connect-src 'none';
frame-src  'none';
form-action 'none';
base-uri   'none';
```

### 3.1 The inline-style decision

Forbidding `style="..."` outright contradicts `03-STACK`, which mandates Radix primitives — Radix sets inline styles for positioning — and v1 Phase 5, which reuses shadcn as-is. Those cannot all hold.

**Decision:** `style-src-attr 'unsafe-inline'` is permitted as a **narrow, documented relaxation**. It allows style *attributes* only. Scripts remain nonce-only, stylesheets remain nonce-only, and `connect-src 'none'` plus `img-src data:` mean injected CSS cannot exfiltrate. The alternative — banning inline-style primitives — would mean rewriting the component library to block a threat we already structurally prevent. Recorded as a deliberate trade, re-reviewed at the external pen-test.

**Phase 0 must also verify** that a Radix dropdown, dialog and tooltip render and position correctly under this CSP, in both the srcdoc and custom-protocol variants.

### 3.2 Opaque origin survives the fallback

If the spike forces the custom-protocol fallback, the frame is still `sandbox="allow-scripts"` **without** `allow-same-origin`. That combination forces an opaque origin **regardless of the URL**, so storage and host-DOM isolation are unchanged. The added cost is a protocol-handler attack surface: the handler serves only hash-verified bundle bytes, accepts no query parameters, resolves no filesystem path from the request, and is registered per module load.

### 4. Phase 0 CSP Spike (Required)

**Before Phase 5 begins, run a spike** to verify that a `srcdoc` iframe inherits the parent's CSP on WebView2 (Windows) and WebKit (macOS/Linux).

**Risk:** Some WebView implementations may inherit the parent's CSP, which could block the nonce'd script under a strict Tauri CSP.

**Test:**
1. Create a minimal Tauri app with a `srcdoc` iframe
2. Set a strict CSP on the parent (`script-src 'none'`)
3. Inject a nonce'd script into the iframe
4. Verify the script executes

**Fallback:** If the iframe inherits the parent's CSP, use a **custom-protocol URL** (e.g., `tauri://module.food-lab/index.html`) with its own CSP header set by the Tauri protocol handler. This is more work but guarantees isolation.

**Decision point:** After the spike, choose `srcdoc` (simpler) or custom-protocol (more isolated). Document the choice in this ADR.


The spike must also render the real **Samples page** (Radix + shadcn + Tailwind) under the exact production CSP, in both variants.


### 5. The bridge

The only channel between UI and host is `postMessage`, with a typed envelope:

```json
{
  "v": 1,
  "session": "<per-load-session-token>",
  "kind": "request",
  "id": "018f...uuidv7",
  "method": "query.list_samples",
  "payload": { "filter": { "status": "received" }, "limit": 50 }
}
```

Host-side validation, in order:
1. `event.source === iframe.contentWindow` (identity check)
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


### 5.1 Large binaries (PDFs, logos)

The bridge limit is 1 MB per message and the sandbox has `frame-src 'none'`, so module UI **never holds PDF or logo bytes**.

- Queries return an opaque **blob handle** `{ id, sha256, bytes, mime }`.
- `openBlob(handle)` asks the **host** to open its own viewer window (outside the iframe). Preview and print happen there.
- `uploadBlob(file)` streams the file to the host in ≤256 KB chunks over the bridge; the host assembles it, verifies size and hash, stores it as a BLOB (ADR-005, ADR-016) and returns the handle.
- Allow-listed method families gain `host.blob.open` and `host.blob.upload`.
- Both adapters (Tauri and Bridge) implement both methods from the first UI phase, so no page is rewritten when the sandbox arrives.


### 6. Bundle format (aligned with ADR-007)

```
bundle/
├── manifest.json                  ← contains module + binding sections
├── manifest.sig.cloud_root        ← signs module_hash (ONCE at publish)
├── manifest.sig.project_license   ← signs bundle_hash (per device)
├── manifest.sig.device_bind       ← Cloud signing service (per device)
├── cert_chain.pem                 ← project licence cert → Cloud root
├── binary.wasm.enc                ← AES-256-GCM encrypted module logic
├── migrations/                    ← NNN.sql files, hashed in manifest
│   └── 001.sql
└── ui/                            ← signed static UI assets
    ├── index.html
    ├── module.js
    └── module.css
```

The manifest fields, `bundle_hash`, and the three signatures are defined in ADR-007. This ADR defines the UI half and the compatibility rules.

---

## 7. Host API versioning and compatibility

`manifest.api_version` is the host API major version. The host advertises its supported range; a major mismatch means **do not load**, with "This module needs a newer version of the app." `SyncHello` / `SyncAck` exchange `module_versions`.

| Direction | Behaviour |
|---|---|
| Admin newer, User older | That module's events are marked `module_incompatible` and explicitly skipped. The cursor still advances to `range_end`. The User shows "Module update required" and requests the new bundle. |
| User newer, Admin older | Commands for that module are rejected with `ModuleVersionMismatch`. The User shows "Waiting for the Admin to update." |
| After the User updates | The Admin sends `scope: "module_refresh"` (ADR-008), replacing **that module's rows and wrapped keys only** — never a `partial` backfill, never a full rebuild. |

Version skew is always a named, visible state. Never silent divergence, never a crash.

## 8. Module lifecycle

| Step | Behaviour |
|---|---|
| Install | Full ADR-007 verification → snapshot → migrations in the install tx → store → register with `bundle_kind` |
| Load | Re-verify signatures, expiry, licence, module access, binary/UI/migration hashes; instantiate; mount frame |
| Update | New version installed alongside the old; migrations per ADR-006; atomic switch; **previous build retained for event replay** |
| Rollback | Restore the pre-update snapshot. **Never downgrade** schema or code in place |
| Uninstall / revoked | Mark revoked; delete bundle and unwrapped Content Key; close frames. Tables **retained, read-only, exportable** (Principle 14) |

## 9. Honest limit

Encrypted content, three signatures, an opaque-origin frame and a validated bridge raise the bar a long way: a copied bundle is inert, and a patched client cannot decrypt content it holds no key for. A determined attacker in full control of a licensed device can read what that device can read. **Strong licensing and isolation gate, not unbreakable DRM.**

---

## Consequences
### Positive
- New modules and new pages ship without an app release.
- One bundle format covers logic, UI, encryption and licensing.
- The UI cannot reach the network, storage, keys, or the host DOM.
- **No UI rewrite in Phase 6b** — the HostClient abstraction handles both Tauri and bridge adapters.

### Negative
- The bridge is a real API surface and must be versioned, fuzzed and reviewed.
- Inlining assets at load time costs a few milliseconds.
- Two runtimes per module (Wasmtime + iframe) means two sets of limits to enforce.
- Phase 0 CSP spike adds a small upfront cost.

### Neutral
- The same UI bundle runs on Admin and User; the host's capability grants differ.
- Modules may ship logic-only (`ui/` absent) — the slots exist in the format either way.

---

## Alternatives Considered

**Compile module pages into the app.** Rejected: every module change becomes an app release.

**`sandbox="allow-scripts allow-same-origin"`.** Rejected: that combination lets the frame strip its own sandbox.

**Serve module UI from a custom protocol origin.** Rejected for v1 default, kept as fallback if srcdoc CSP inheritance fails.

**Let module UI call the Cloud directly.** Rejected: the Cloud is not in the data path, and `connect-src 'none'` makes it structurally impossible.

**Skip UI sandboxing because the UI is signed.** Rejected: signing proves who published it, not that it is bug-free.

**Write UI directly against `invoke()`.** Rejected: entire UI would need rewrite in Phase 6b when iframe bridge is required.
---

## Enforcement

- CI rejects a bundle with any `ui/` file missing from `ui_sha256`, or with `eval`/`new Function`/remote URLs in the JS.
- The bridge dispatcher is the only path from a module frame to host code.
- The frame-mount function is the only path that builds the boot document; it always generates a fresh nonce and session token.
- Lint: no host method may be registered unless it appears in the manifest capability schema.
- Every rejected bridge call is logged with module id, version, method and reason.
- Phase 0 CSP spike must be completed and documented before Phase 5 begins.

### Tests
- [ ] Tampered UI asset → refused before mount
- [ ] Module UI attempts `fetch` → blocked by CSP, logged
- [ ] Module UI attempts `localStorage` → throws (opaque origin)
- [ ] Bridge message with wrong session token → rejected
- [ ] Bridge message from another window → rejected by `event.source` check
- [ ] Undeclared method → rejected
- [ ] Raw SQL in a filter payload → schema rejection
- [ ] 1 MB + 1 byte message → frame closed, security event logged
- [ ] HostClient Tauri adapter works in Phases 3–6a
- [ ] HostClient Bridge adapter works in Phase 6b
- [ ] Same React page works with both adapters (no rewrite)
- [ ] Phase 0 CSP spike completed: srcdoc or custom-protocol chosen and recorded
- [ ] Radix dropdown / dialog / tooltip render and position under the CSP
- [ ] `localStorage` throws under **both** srcdoc and the custom-protocol fallback
- [ ] `command()` without an `idempotencyKey` → type error at build time
- [ ] Module UI importing `@tauri-apps/api` → lint failure
- [ ] Admin newer / User older → explicit `module_incompatible` skips, cursor advances, prompt shown
- [ ] After module update → `module_refresh` replaces that module's rows and keys only
- [ ] `module_refresh` never touches another module's rows
- [ ] Unsupported `api_version` → clean "needs a newer app" message, never a crash
- [ ] Uninstalled module → bundle and Content Key gone, data still exportable
- [ ] Opening a 5 MB signed PDF from module UI works through openBlob, no PDF bytes cross the bridge
- [ ] Logo upload larger than 1 MB succeeds in chunks