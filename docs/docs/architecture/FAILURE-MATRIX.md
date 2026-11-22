# Failure Matrix
> **Status:** Locked
> **Last updated:** 2026-11-22
> What the system does when each component is unavailable. If behaviour is not in this table, it is undefined and must be added before shipping.
Legend: ✅ works · ❌ refused · ⚠️ degraded / bounded · — not applicable
---
## 1. Capability matrix
| Scenario | User reads | User writes | Admin reads/writes | Enrol / invite | Module install | Cloud backup | Local backup + export | Recovery |
|---|---|---|---|---|---|---|---|---|
| All up | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Cloud down** | ✅ | ✅ | ✅ | ❌ | ❌ (cached bundles run until expiry) | ❌ paused | ✅ | ❌ |
| **Admin down** | ✅ cached | ❌ `ADMIN_OFFLINE` | ❌ | ⚠️ account created, assignment waits | ❌ | ❌ | ❌ on Admin; User export ✅ | — |
| **User down** | — | — | ✅ | ✅ | ✅ on Admin | ✅ | ✅ | — |
| Cloud + Admin down | ✅ cached | ❌ | ❌ | ❌ | ❌ | ❌ | User export ✅ | ❌ |
| Cloud + User down | — | — | ✅ | ❌ | ✅ on Admin | ✅ | ✅ | ❌ |
| Admin + User down | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ⚠️ via Cloud backup |
| Everything down | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

**The two rows people misread:**
- *Cloud down* → the project **keeps working**, reads and writes, because membership certificates verify locally (ADR-012). Bounded by the licence grace window.
- *Admin down* → **no writes anywhere**, by explicit product rule (ADR-009).
---
## 2. Network scenarios
| Scenario | Behaviour | Governing ADR |
|---|---|---|
| Same LAN, no internet | mDNS + WireGuard, zero config, fully operational | 017, 018 |
| One side reachable | Outbound to the reachable peer; keep-alive holds the mapping | 019 |
| Both behind cone NAT | Discovery-coordinated hole-punch; direct, no relay | 020, 024 |
| Both behind symmetric CGNAT | Punch fails fast → relay (customer or opt-in blind) | 024 |
| UDP blocked | TCP/443 carrier; slower, same encryption | 024 |
| Discovery disabled / opted out | LAN, cached endpoint, QR/manual, relay still work | 020 |
| Discovery down | Cached endpoint + LAN work; new cross-network pairs need manual endpoints | 020 |
| No connectivity at all | Sneakernet: **read-only** snapshot export/import | 008, 024 |
| Probe receives no echo | No endpoint stored; peers must use LAN, manual pairing or a relay | 020 |
| Relay tampered with a packet | Peer rejects it; relay can only drop, never read or forge | 024 |
---
## 3. Data-loss and recovery scenarios
| Scenario | Outcome | Governing ADR |
|---|---|---|
| Admin disk lost, backup exists, **assisted** mode | Recovery ceremony: 2FA + 48 h + alerts + quorum → HSM re-wraps Backup Key to new device X25519 key → restore → erasure ledger re-applied | 022, 016 |
| Admin disk lost, **zero-knowledge**, code kept | Customer supplies the recovery code; no staff involvement | 022 |
| Admin disk lost, **zero-knowledge**, code lost | **Data unrecoverable.** Disclosed at enrolment and every manual backup | 022 |
| Plan 4 manual backup, passphrase forgotten | That archive is unrecoverable; other backups unaffected | 022 |
| Plan 1, Admin disk lost, no local backup | Project lost. Plan 1 has no Cloud backup by design | 021 |
| Restore from a pre-erasure backup | Ledger re-applied before write access; erased resource stays unreadable | 016 |
| Migration fails mid-way | Pre-migration snapshot restored; `schema_version` unchanged | 005 |
| Patch fails before commit | Transaction rollback; no partial state | 015 |
| Patch fails after commit | Restore from pre-update snapshot; **never a downgrade** | 015 |
| Snapshot transfer interrupted | User keeps its old cursor, re-requests missing chunks | 008 |
| Cache file deletion fails after an erasure | Cache directory poisoned; no cached snapshot served until rebuilt; security event logged | 016 |
---
## 4. Licence, permission and version scenarios
| Scenario | Behaviour | Governing ADR |
|---|---|---|
| Licence expired, ≤14 days | Grace: full operation + prominent banner | 014 |
| Grace exhausted | **Read-only allow-list:** read, export, print, local backup, verify audit. Restore from corbeille is a write → denied | 014 |
| Payment failed | Dunning day 1/3/7 → day 14 read-only. **Nothing deleted** | 014 |
| Downgrade, too many users | Admin picks who stays active; the rest read-only. No deletions | 014, 021 |
| Custom module no longer entitled | Module disabled; its tables retained and exportable | 011, 014 |
| Bootstrap window (30 d) lapses, never activated | Read-only; export always available | 023 |
| Clock rolled backwards | Ignored for expiry; monotonic anchor governs | 014 |
| `admin_state.db` deleted, or older than its keychain revision mirror | Expiry-unknown → **read-only immediately** until Cloud contact (fail-closed) | 014 |
| New or replacement device, no anchor history | Read-only until first Cloud contact; anchor seeded from the signed Cloud time | 014 |
| Offline activation file older than 7 days | Refused as an anchor source | 014, 023 |
| Critical patch deadline passed | **Restricted mode:** writes refused; read, export, print, local backup available | 015 |
| Permission granted while member offline | On reconnect: partial backfill snapshot delivers the history | 012, 008 |
| Permission revoked while member offline | On reconnect: `Purge` deletes the rows; best-effort, honestly described | 012 |
| Member revoked entirely | `Purge{all}`, session closed, certificate revoked locally, Cloud epoch bumps on next sync | 012 |
| Admin newer module, User older | Explicit `module_incompatible` skips; cursor advances; update prompt; partial backfill after update | 011, 012 |
| User newer module, Admin older | Commands rejected with `ModuleVersionMismatch`; "waiting for Admin to update" | 011 |
| Two devices both claim Admin | Only the Cloud-issued authority certificate is accepted; the other is refused by Users | 002, 010 |

---
## 5. Invariants that hold in every cell above
1. A User never reports success for a write the Admin has not committed.
2. A User never writes a business table.
3. Export, print and local backup work in **every** billing and licence state.
4. The audit chain is never deleted or rewritten.
5. A restore always re-applies the erasure ledger before write access returns.
6. No snapshot ever enters the event log.
7. The Cloud never sees plaintext business data.

If a failure mode violates one of these, it is a bug, not a trade-off.