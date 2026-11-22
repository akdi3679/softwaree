
04-GLOSSARY.md

# Glossary

> **Status:** Living document
> **Last updated:** 2026-11-22
> One vocabulary across docs, code, UI and support. If a term appears in code with a different meaning, the code is wrong.

---

## Systems and roles

- **v1 (architecture)** — the architecture's first release: Admin + User apps, sync, mesh, two modules. 
- **v1-foodlab** — the first *shippable milestone*: Admin-only, one module (food-lab), Plan 1+. 
- **v1.1** — the milestone that adds the User app, sync, mesh, roles and per-resource keys. `v1/DEVIATIONS.md` lists exactly what v1-foodlab defers.

**Admin** — the customer device that is the sole authoritative writer for one project. Also a server on the project mesh. May run headless on an always-on mini-PC.

**User** — a customer device holding an authorized, disposable projection. Never writes business data.

**Cloud** — our control plane: accounts, devices, projects, plans, licences, signing, certificates, discovery, backups, audit snapshots. Never business data.

**Owner Console** — the staff surface on `/ops/*`, reachable only over the ops VPN.

**Ops VPN** — our own WireGuard network for staff and ops hosts. Not in the customer data path.

**Control plane** — everything the Cloud does. Contrasted with the **data path**, which is Admin ↔ User only.

**Data path** — the sync connection between Admin and User. The Cloud is never in it.

---

## Data and state

**Project** — one business, one Admin, one `project.db`. The unit of isolation, backup and deletion.

**Projection** — a rebuildable local copy of the data a member may see. On the User, tables prefixed `proj_*`.

**Event** — an immutable state delta in the project's global sequence.

**Event envelope** — `sequence`, `event_id`, `event_type`, `resource_type`, `resource_id`, `module_id`, `module_version`, `actor_id`, `project_id`, `tx_id`, `event_version`, `aggregate_version`, `payload_format`, `payload`, `idempotency_key`, optional `supersedes_event_id`.

**apply_event** — the single function that turns an event into table state, on both Admin and User. The only writer of business tables.

**Outbox** — delivery work written in the same transaction as the event. On the User it exists but is **never written in v1**.

**Inbox** — received events awaiting apply, on the User.

**Sequence** — per-project monotonic event number. Five projects on one Admin means five sequences.

**Cursor** — a member's `last_applied_sequence`. Advances to a batch's `range_end`.

**Range batch** — "everything you may see in #X–#Y is here." Gaps inside a delivered range carry an explicit reason.

**Skip reason** — `denied` (not authorized) or `module_incompatible` (module version cannot apply it).

**Aggregate version** — the version used for optimistic concurrency (`expected_version`).

**Supersede** — a correction expressed as a new event referencing `supersedes_event_id`. History is never rewritten.

**Table classes** — Projected business tables (change only via `apply_event`), Log tables (append-only), Host-state tables (not replayed from events). Defined in ADR-012 §5.
---

## Permissions and identity

**Permission** — `module.resource.action`, per resource type in v1. Wildcards allowed in the action position only.

**Role** — a named bundle of permissions. Effective permission is the union of a member's roles, evaluated live.

**Module access** — the coarse entitlement deciding whether a bundle may be issued and loaded. Synced to the Cloud; finer permissions never are.

**Membership certificate** — Cloud-signed, locally verifiable proof of project membership (device pubkey, role IDs, module access, 90-day validity, revocation epoch). Why the Cloud can go down.

**Admin authority certificate** — Cloud-signed proof of which device is the active Admin. Verified by Users.

**Revocation epoch** — a counter bumped on membership or Admin changes; the Cloud stops issuing certificates below it.

**Permission version** — per-member counter bumped on any permission change. Invalidates snapshot caches; carried in batches, snapshots and purges.

**Purge** — an Admin frame instructing a User to delete revoked resources and their keys. Best-effort, honestly described.

**Purge version** — per-member monotonic counter for purges. The User acks the highest contiguous purge_version applied.

**Backfill** — a partial snapshot delivering newly authorized history after a grant.

**Device identity** — the Ed25519 public key. The virtual IP is an address, **not** a credential.

---

## Modules

**Module** — a business vertical: `medical-reception`, `food-lab`. Logic + UI + manifest in one bundle.

**Bundle** — manifest (triple-signed) + cert chain + `binary.wasm.enc` + `ui/` + `migrations/`.

**Manifest** — canonical JSON (JCS) describing the module, its hashes, capabilities, tables and binding. Split into a module section (signed once at publish) and a binding section (per device).

**Module section** — the part of the manifest identical for every device. Signed by `cloud_root` once at publish. Contains `module_id`, `module_version`, `api_version`, `binary_sha256`, `ui_sha256`, `migrations_sha256`, tables, commands, queries, pages, capabilities, sensitive_resources, derived, replay, rule_version, required_core_min.

**Binding section** — the part of the manifest unique to each device. Signed by `project_license` and `device_bind`. Contains `project_id`, `license_id`, `license_expiry`, `device_pubkey`, `content_key_slot`, `ciphertext_sha256`, `issued_at`.

**module_hash** — `SHA-256("platform.module.v1" || JCS(module_section))`. Signed by `cloud_root`.

**bundle_hash** — `SHA-256("platform.bundle.v1" || hex(module_hash) || JCS(binding_section))`. Signed by `project_license`. Hashes are lowercase 64-char hex in every concatenation and JSON tuple.

**cloud_root signature** — "published by us, unmodified."

**project_license signature** — "this project, on this plan, may run it."

**device_bind** — Cloud signature over `(bundle_hash, device_pubkey, project_id, license_expiry)`. A signature, never a MAC.

**bundle_kind** — `licensed` (3 signatures + expiry) · `perpetual` (3 signatures, no expiry, still device-bound) · `bootstrap` (root-only, time-boxed, standard modules only).

**Content Key** — random per `(module_version, device)`, encrypting the WASM, wrapped to that device's X25519 key. Reused across renewals of the same pair; never across devices or module versions.

**Bootstrap bundle** — root-only signed standard module used during the 30-day offline bootstrap. Time-boxed exception.

**Host API / api_version** — the versioned function surface a module may call. Major must match.

**HostClient interface** — the TypeScript abstraction that module UI pages call. Has two adapters: Tauri (Phase 3–6a) and Bridge (Phase 6b+). Same pages work in both contexts. `command()` requires `idempotencyKey` and optional `expectedVersion`.

**Bridge** — the typed, allow-listed `postMessage` channel between module UI and host.

**Module UI sandbox** — opaque-origin iframe, `sandbox="allow-scripts"`, nonce CSP, `connect-src 'none'`, `style-src-attr 'unsafe-inline'` (documented relaxation for Radix inline styles).

**Structured filter** — a typed enum query filter. Raw SQL from a module is an authorization bypass.

**handle_command** — the function a module exports: receives a validated command, returns event drafts. Does not write to tables.

**apply_event (module side)** — the function a module exports: receives an event, returns row operations. The host executes them through the single `apply_event` entry point.

**module_version** — the module build that produced an event. Replay resolves this build, or a declared upcaster, or fails loudly. Never "latest wins".

**is_in_signed_report** — flag on a result, set by `apply_event` from a signed report's frozen `included_results`. Blocks in-place mutation and `recompute_derived`; correction by new row remains allowed.

**recompute_derived** — typed patch op calling the module's signed pure function on rows never included in a signed report.

---

## Networking

**Mesh** — our own userspace WireGuard network, per project.

**Virtual address** — `(project_id, virtual_ip)` from `10.50.0.0/16`. Stable within the project.

**Namespace** — one address space and one tunnel instance per project, each with its own UDP port.

**Discovery** — our endpoint phone book. Stores an **observed** IP (heartbeat packet source) and a **probe-confirmed** UDP port (source of the STUN-claimed endpoint's echo). Answers project-scoped lookups — **User → Admin only, Admin → any member**. Coordinates punching. Never data.

**Discovery heartbeat** — device → Cloud, every **60 s**.

**Admin session keepalive** — User ↔ Admin WebSocket, every **30 s**.

**WireGuard keep-alive** — tunnel, every **25 s**.

**Hole-punch** — simultaneous UDP sends coordinated by discovery. Works with cone NAT, usually fails with symmetric NAT.

**Rendezvous** — the short-lived record discovery creates for a hole-punch pair. Polled by both devices until both are registered.

**Blind relay** — opt-in forwarder of WireGuard ciphertext. No keys. Can drop, cannot read or forge.

**Customer relay** — a relay the customer hosts. Same ciphertext-only property.

**TCP/443 carrier** — the same encrypted packets over TLS/TCP where UDP is blocked.

**Self-test** — local reachability assessment: interfaces, STUN, **external probe**, IPv6, NAT behaviour.

**External probe** — our service sends a packet *to* the device. Self-connect proves nothing because of NAT hairpinning.

**Sneakernet** — USB transfer of **read-only signed snapshots**. Never writes.

**Path ladder** — LAN → cached → discovery → punch → relay → offline.

---

## Licensing and lifecycle

**Plan** — a row in the Cloud database: limits + module entitlements + price. Data, not code.

**Entitlement** — a capability that exists only because the Cloud will sign something granting it.

**Licence** — signed statement of a project's plan and validity. 30-day TTL, 14-day grace. Plan 1 is perpetual.

**Grace** — bounded full operation after licence expiry.

**Read-only allow-list** — read, export, print, local backup, verify audit. Restore is a write and is denied.

**Restricted mode** — after a critical patch deadline: writes refused, data reachable.

**Bootstrap** — first-run offline state, 30 days, standard modules, zero Users.

**Activation** — one Cloud round trip (or a signed offline file) converting bootstrap to a licence.

**Monotonic clock anchor** — persisted time reference; `trusted_now = max(last_seen_cloud_time, anchor + elapsed)`. Defeats clock rollback. Lives in device-level `admin_state.db`, not `project.db`.

**Corbeille** — soft-deleted records in the Admin's `tombstones`. Quota = serialized bytes.

**Hard delete** — tombstone removed and resource key destroyed; 30-day support-assisted recovery from pre-deletion backups.

**Crypto-shredding** — destroying a resource's content key so ciphertext stays but plaintext is unrecoverable.

**Erasure ledger** — permanent metadata-only record of shredded resources, **re-applied on every restore**.

**Blind index** — HMAC index allowing search over encrypted fields without storing plaintext.

**Live heart** — Cloud-authoritative updates: app, core, module, schema, typed data patch, logic.

**Typed patch** — an allow-listed operation compiled to SQL locally by the Admin. Never raw SQL from the Cloud.

**Ring rollout** — 5% → 25% → 100% with automatic health gates. Rollout state lives on the Cloud side, not in the signed envelope.

**Kill-switch** — pre-signed `halt_and_restore` instruction shipped with every critical patch. Signed with the **patch key** (never the app-updater key).

---

## Keys and recovery

**Device Signing Key** — Ed25519. Identity and signatures. Never encryption or derivation.

**Device Encryption Key** — X25519. Receives wrapped Content Keys and transfer bundles.

**Project Master Key** — keychain key wrapping `keys/keyring.enc`.

**Project DB Key** — SQLCipher key for `project.db`.

**Project Keyring Key** — wraps per-resource content keys.

**Project Blind Index Key** — HMAC key for blind indexes.

**Projection Cache Key** — encrypts per-member snapshot caches.

**Backup Key** — random per-backup archive key. Wrapped to the Escrow public key (assisted) or recovery code (ZK).

**Escrow Key** — asymmetric (X25519) keypair per project. Public key given to the device at registration. Private key stays in the Cloud HSM.

**Assisted recovery** — default mode. Cloud can decrypt only via 2FA + 48 h + alerts + quorum + audit.

**Zero-knowledge mode** — Backup Key wrapped only to the customer's recovery code. Cloud cannot decrypt. Lost code = lost backups.

**Recovery code** — 256-bit secret, 24-word mnemonic, shown once.

**Recovery ceremony** — the controlled, audited, quorum-approved escrow release procedure.

**Break-glass** — time-boxed emergency staff access with alerts and mandatory review.

**Transfer bundle** — a keyring wrapped to a new device's X25519 key, used for planned device moves.

**App-Updater Signing Key** — separate offline key for `tauri-plugin-updater`. Quorum-gated. Rotated by a dual-signature transition update.

---

## Statuses and errors

**ADMIN_ONLINE / ADMIN_OFFLINE / ADMIN_UNKNOWN** — the three User-side Admin states. Identical in UI, protocol and docs.

**Error::AdminOffline** — returned when a write cannot reach the Admin. Replaces the older `AdminUnavailable`.

**ConflictError** — stale `expected_version`; carries the current version.

**IdempotencyConflict** — same `(actor_id, idempotency_key)` reused with a different `request_hash`. Refused, never silently re-executed.

**ModuleVersionMismatch** — Admin and User module versions are incompatible.

**Projection lag** — "Saved on Admin — updating your view." The write committed; the local view is catching up. **Not** a pending write.

---

## Approvals

**Quorum** — the number of approvals required for high-risk actions (publish, patch, escrow release). Default 2. Solo-owner mode: 1 hardware-key approval + mandatory delay + customer alert.

**approvals_required** — the setting that controls quorum. Defined in ADR-013.

## Additional terms
- **Account contacts** — signup email plus verified extras; changes take effect after a 7-day cooling-off, and recovery alerts go to all of them (ADR-010).
- **Backup Passphrase Wrapping Key** — Argon2id→HKDF key wrapping a manual or local-only Backup Key, never escrowed (ADR-022).
- **Blob handle** — opaque reference to a stored binary that module UI uses instead of bytes, preventing large payloads from crossing the bridge (ADR-011).
- **frozen_when** — manifest rule naming which rows `recompute_derived` must not touch (ADR-007/015).
- **nat_behaviour** — NAT classification: `none` (public IP), `cone` (endpoint-independent mapping), `symmetric` (endpoint-dependent), or `unknown` (ADR-020).
- **probe_token** — single-use token binding a probe echo to a heartbeat, preserving STUN anonymity (ADR-020).
- **Recovery service** — isolated, minimal process that performs the KMS unwrap and re-wrap during assisted recovery, with no other network access (ADR-022).
- **state_revision** — counter in `admin_state.db` mirrored in the OS keychain to detect rollback or tampering (ADR-014).
