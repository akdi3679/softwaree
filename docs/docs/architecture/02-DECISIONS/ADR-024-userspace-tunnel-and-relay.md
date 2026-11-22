# ADR-024: Userspace Tunnel, Hole-Punching, and the Blind Relay

**Status:** Accepted
**Date:** 2026-11-20
**Deciders:** Architecture team
**See also:** ADR-017 (parent), ADR-018 (addressing), ADR-019 (self-test), ADR-020 (discovery), ADR-005 (storage), ADR-013 (our own ops VPN)

---

## Context

Four claims in the earlier networking ADRs were not implementable as written:

1. **"WireGuard is built into the kernel."** True on Linux, false for our customers. On Windows it needs a driver and administrator rights, which contradicts a no-admin installer and Tauri's small-binary model.
2. **"`10.50.0.0/16` avoids collisions."** It reduces them. A corporate LAN or VPN using `10.50.x.x` would clash with a system-level adapter, and every project's Admin being `10.50.0.1` is ambiguous on a multi-project machine.
3. **"Both behind CGNAT → run a customer relay VM."** A doctor will not run a VM. And hole-punching — which works through many NATs — was missing entirely.
4. **"Test inbound reachability by connecting to my own public IP."** NAT hairpinning makes that test fail on most routers regardless of real reachability.

This ADR replaces those mechanisms.

---

## Decision

### 1. Userspace WireGuard inside the app

- Implement the tunnel with a Rust userspace WireGuard library (`boringtun` or an actively maintained equivalent) plus a small userspace TCP/IP stack (`smoltcp` or equivalent). Exact crates and versions are pinned at Phase 0.
- **No kernel module. No TUN/TAP adapter. No OS route changes. No administrator rights.**
- Virtual addresses exist only inside the app's stack. A host LAN using the same range is unaffected.
- The app opens ordinary UDP sockets. Everything above the socket is our code, in our process, auditable.

Consequences: identical behaviour on Windows, macOS and Linux; a standard-user installer; no driver to sign, distribute or debug; no interference with a customer's existing VPN.

### 2. Per-project namespaces

- One tunnel instance per project, each with its **own local UDP port**.
- Every address is the pair **`(project_id, virtual_ip)`**. There is no bare-IP API.
- A Plan 4 Admin hosting five projects runs five independent tunnels. A User in two projects has two addresses and two tunnels.
- Discovery keys and lookups are project-scoped (ADR-020).

### 3. Hole-punching before any relay

```
1. Both devices publish their observed endpoint to discovery
2. Requester calls POST /v1/discovery/punch (signed, same-project)
3. Discovery returns a rendezvous_id to the requester. The target learns of it from the long-poll
   GET /v1/discovery/inbox (or from pending_punches in its heartbeat response), ADR-020
4. Both devices short-poll GET /v1/discovery/punch/{rendezvous_id}
   until both are registered and discovery answers with the same
   {peer_public_ip, peer_udp_port, punch_at}
5. Both devices send WireGuard handshake packets simultaneously
6. NAT mappings now exist in both directions → tunnel establishes
```

- Works with **endpoint-independent (cone)** mapping on at least one side.
- Usually fails with **symmetric NAT / filtering CGNAT** on both sides. We detect this in the self-test (ADR-019) and fall through without retrying forever.
- The WireGuard keep-alive (25 s) holds the mappings open.
- Discovery returns 409 when both sides are `symmetric`; the client goes straight to a relay.

**Coordination mechanism (how both sides learn the same `punch_at`).** The rendezvous record plus short polling is sufficient and keeps discovery stateless between heartbeats. The rendezvous record is deleted on success or after the window expires. The only held server request is the target's inbox long-poll (ADR-020); there is no other server push.

### 4. The blind relay (opt-in)

A relay we operate that forwards **only WireGuard ciphertext**.

```
POST /v1/relay/session
  Body: { device_id, project_id, target_virtual_ip }
  Auth: signed (timestamp + nonce), same-project scope, relay opt-in required
  200: { relay_endpoint, relay_tcp443_endpoint, session_token, expires_at }
```

Properties:
- The relay never holds a device private key and never terminates the tunnel. WireGuard sessions are end-to-end between the two devices.
- A malicious or compromised relay can **drop** packets (denial of service) but cannot **read or forge** them: peers authenticate by public key.
- The relay sees only: two endpoints, packet sizes, and timing. It logs no payloads and retains session metadata for 24 hours for abuse handling.
- **Opt-in per project**, with a plain-language disclosure before enabling. Customer-hosted relays remain fully supported and are preferred when available.
- Bandwidth is metered per project to keep the cost model honest (`03-STACK.md`).

### 5. TCP/443 fallback

Many corporate and hotel networks block UDP. The same WireGuard packets are carried inside a TLS-wrapped TCP stream to port 443.

- Used only when UDP fails.
- TCP-over-TCP throughput collapse is mitigated with small buffers, disabled Nagle, and the 25 s keep-alive; we document that relayed TCP is a fallback, not the performance target.
- The carrier changes; the encryption and peer authentication do not.

### 6. Self-hosted STUN and external probe

- `stun1.<platform-domain>` and `stun2.<platform-domain>` run in our infra. Third-party STUN is an explicit opt-in fallback only.
- Inbound reachability is measured by asking our probe service to send a packet **to** the device's observed endpoint. **Self-connect is never used** — hairpinning invalidates it.
- A TCP/443 probe determines whether the fallback carrier is needed.

### 7. Sneakernet is read-only

For air-gapped sites, USB transfer carries **signed snapshot payloads only** (ADR-008 format), imported into a User's projection.

- No commands, no events, no writes cross this path. The single-writer rule (ADR-002) is preserved.
- Imports are verified against the Admin device signature and the projection format version, and applied atomically.

---

## The path ladder (single implementation)

```
LAN (mDNS)
  → cached direct endpoint
  → discovery lookup (project-scoped)
  → discovery-coordinated UDP hole-punch (rendezvous + short-poll)
  → relay: customer-hosted, else opt-in blind relay
       (TCP/443 carrier if UDP is blocked)
  → offline (ADMIN_UNKNOWN / ADMIN_OFFLINE on the User)
```

LAN is attempted first, before and after any discovery interaction. The cheapest working path always wins.

---

## Consequences

### Positive
- The installer needs no administrator rights on any OS.
- Address collisions with real networks become harmless.
- Multi-project Admins and multi-project Users are unambiguous.
- Most CGNAT-to-CGNAT pairs connect directly via hole-punch, with no relay cost.
- The remaining pairs get a realistic one-toggle option instead of "run a VM".
- No third party is ever in a position to read customer data.

### Negative
- Userspace networking costs some throughput versus a kernel path. For command/event traffic and occasional 50 MB snapshots, this is acceptable; we benchmark at Phase 0.
- We own more code: the tunnel integration, punch logic, relay, probe. Each is a security surface requiring review and fuzzing.
- The blind relay adds bandwidth cost and an abuse surface (mitigated by metering, auth, and short retention).
- TCP fallback is slower and must be presented as a fallback.

### Neutral
- The relay is a plain packet forwarder; it is not a service that understands our protocol.
- Publishing the protocol spec lets a customer run their own relay or audit ours.

---

## Alternatives Considered

**Kernel WireGuard + system adapter.** Faster. Rejected: driver signing, admin rights, OS route conflicts, and per-OS behaviour differences — all for throughput we do not need.

**Ship Tailscale/ZeroTier as the transport.** Rejected by ADR-017: a third party in the path, plus the same driver problem.

**Customer-hosted relay only.** Rejected as the sole option: unrealistic for our actual buyers. It remains supported for customers who prefer it.

**A relay that terminates the tunnel (TURN-style with our keys).** Rejected: it would put us in a position to read customer data, breaking the platform's central promise.

**Skip hole-punching.** Rejected: it is the difference between "most remote pairs work free and direct" and "most remote pairs need a relay".

**Self-connect reachability test.** Rejected: hairpinning makes it wrong far more often than right.

**Third-party STUN by default.** Rejected: it introduces an unnecessary third party into a product whose premise is not doing that.

---

## Enforcement

- Lint: no code may install an adapter, modify the OS route table, or request elevated privileges.
- The installer is CI-tested on Windows with a standard user account.
- One tunnel instance and one UDP port per project; a test asserts no sharing.
- The path ladder lives in one function; every transport is attempted in the documented order.
- The relay binary contains no key material and no protocol decoder — only forwarding, auth, and metering.
- Relay sessions require opt-in, same-project scope, and a signed request; tokens expire.
- Sneakernet import accepts snapshot payloads only; anything else is rejected and logged.

### Tests
- [ ] Windows standard-user install → tunnel works, no elevation prompt
- [ ] Host LAN on `10.50.x.x` → no conflict, no route changes
- [ ] Two projects on one Admin → two ports, two tunnels, no cross-talk
- [ ] Cone NAT both sides → rendezvous + punch succeeds, no relay used
- [ ] Symmetric NAT both sides → punch fails fast, relay offered with a reason
- [ ] Relay sees ciphertext only; a flipped byte is rejected by the peer
- [ ] Relay cannot impersonate a peer (wrong key → handshake fails)
- [ ] UDP blocked → TCP/443 carrier connects and syncs
- [ ] Relay disabled by the customer → no session issued, LAN still works
- [ ] Probe-based inbound test correct on a hairpinning router
- [ ] Sneakernet export/import round-trips a projection; a command payload is rejected
- [ ] Relay session metadata erased after 24 hours