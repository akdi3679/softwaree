# ADR-013: Private Channel (`/ops/*`) and the Owner Console

**Status:** Accepted
**Date:** 2026-11-20
**Deciders:** Architecture team
**See also:** ADR-001 (repo separation), ADR-003 (superseded Operations Tailnet), ADR-007 (module signing), ADR-014 (plans), ADR-015 (patching), ADR-022 (recovery)

---

## Context

The owner's capabilities were described in prose — see users, payments and backups; create modules, projects and plans; push live-heart updates — but the only architectural statement was "private channel `/ops/*`". Two things were missing:

1. **A design.** Who logs in, with what, from where, with which roles, audited how.
2. **A network story.** ADR-003 had an Operations Tailnet for exactly this. It vanished when ADR-003 was superseded, leaving "the customer has no network route" as an assertion rather than a mechanism — which is not true of a public HTTPS listener by default.

## Decision

The owner surface is a **separate service** — the Owner Console — served on `/ops/*`, reachable only over our own operations VPN.

### 1. Network

```
public listener  (0.0.0.0:443)  → /v1/*   only.  /ops/* → 404, always.
ops listener     (wg-ops IP)    → /ops/*  only.  Not bound to any public address.
```

- The ops network is **our own WireGuard mesh for staff devices and ops VMs**. Using a VPN for our own team is entirely consistent with "no third party in the customer data path": customers are not on it, and it carries no customer business data. This replaces ADR-003's Operations Tailnet.
- Separate process, separate container, separate DB role, separate logs.
- The ops DB role has **read-only** access to customer metadata tables and **no** access to signing keys.
- There is no route from the ops network into a customer's project mesh, and none in the reverse direction.

"No network route" is therefore a fact about binding and routing, not a hope about URLs staying secret.

### 2. Staff authentication

- Per-staff accounts. Never shared logins.
- **Hardware key (WebAuthn) required**, plus a second factor (TOTP). No password-only staff access, ever.
- Roles: `owner`, `ops`, `support-read`.
- Session TTL 15 minutes, idle timeout 10 minutes, all sessions revocable instantly.
- Joiners/leavers: staff access is revoked in the same transaction as the HR event; quarterly access review.

### 3. Capabilities

| Capability | Role | Approval |
|---|---|---|
| View accounts, projects, devices, plans, payments, backup metadata | `support-read` and above | — |
| Publish a module version | `owner` | two-person |
| Create / edit plans (plans-as-data, ADR-014) | `owner` | two-person |
| Re-issue or extend a project licence | `ops` | logged |
| Approve a live-heart patch | `owner` | **two-person, offline signing ceremony** (ADR-015) |
| Control ring rollout / trigger kill-switch | `ops` | logged; kill-switch is pre-signed |
| Approve escrow key release for recovery | `owner` | **two-person + 48 h wait + customer alerts** (ADR-022) |
| Region routing, deployment, infra config | `ops` | logged |

### 4. Visibility is metadata-only

The Console can see: account id, email, plan, billing state, project id, business type, admin last name, device registry, module licences, backup blob sizes and timestamps, audit chain heads, discovery metadata (ADR-020).

The Console can **never** see: patient names, lab results, appointments, invoices, any business row, or plaintext backup content. There is no business data in the Cloud to see (Principle 1), and no code path that could fetch it.

**Support diagnostics** are the one exception, and they are customer-initiated: the customer clicks "Share diagnostics" in the Admin app, which produces a scoped, time-boxed, redacted bundle. The Console can only read what the customer explicitly sent. Every read is audited and the customer can see the access log.

### 5. Owner actions are audited

- Append-only, hash-chained, same rule as Principle 11: `SHA-256("platform.audit.v1" || prev_hash || JCS(entry))`.
- Every entry records actor, role, action, target, before/after metadata, approval chain, and source IP.
- **Reads of customer metadata are audited too**, not just writes.
- Two-person approvals record both identities and both signatures. The system rejects an approval where approver == requester.
- The owner audit chain is itself snapshotted and reviewed weekly.

### 6. Break-glass

Emergency access (e.g. the only owner's hardware key is lost) exists, and is deliberately unpleasant: time-boxed to 60 minutes, requires two independent staff confirmations, alerts every owner contact, and forces a written post-incident review. It is never a silent path.

---

## Consequences

### Positive
- The owner's stated capabilities have a real, auditable home.
- The customer-facing attack surface does not include any owner endpoint.
- Compromise of the public API does not yield module publishing, patch signing, or escrow release.
- Staff reads of customer metadata are visible to the customer.

### Negative
- Staff need VPN setup and hardware keys. Accepted — it is a small team and the crown jewels are behind it.
- Two-person approval slows publishing and recovery. That is the point.
- One more service to deploy, monitor and patch.

### Neutral
- The Console is a separate SPA built from `platform-cloud/`, not from `product/`. Customers never receive its code.
- The ops VPN is our infrastructure; it is not a product feature and is not shipped to customers.

---

## Alternatives Considered

**`/ops/*` on the public listener with strong auth.** Rejected: it puts owner endpoints inside the internet-facing attack surface, and "no network route" becomes false.

**Obscure URL prefix as the protection.** Rejected: security by obscurity is not a control.

**Reuse the customer mesh for staff access.** Rejected: it would place our team inside the customer data path — exactly what ADR-017 forbids.

**A third-party admin SaaS.** Rejected: vendor lock-in, per-seat cost, and it would hold customer metadata.

**Single-person approval for speed.** Rejected: one compromised staff account would be enough to sign a patch or release a backup key.

---

## Enforcement

- CI test: every `/ops/*` path returns 404 on the public listener, for every method.
- The ops service binds only to the ops interface; a config test fails the build if it binds `0.0.0.0`.
- Every `/ops/*` handler requires a staff role check and writes its audit entry **in the same transaction** as its effect.
- Two-person approval is enforced in code (`approver_id != requester_id`), not in policy documents.
- The ops DB role cannot call the signing service; only the publisher flow can, and only with a recorded approval.
- Quarterly access review; automated alert on any break-glass use.

### Tests
- [ ] Public listener: `/ops/anything` → 404 for GET/POST/PUT/DELETE
- [ ] Ops listener not reachable from a customer device
- [ ] Staff login without hardware key → refused
- [ ] `support-read` attempts module publish → refused, audited
- [ ] Same person requests and approves → refused
- [ ] Recovery approval without 48 h elapsed → refused
- [ ] Metadata read appears in the customer-visible access log
- [ ] Break-glass session expires at 60 minutes and alerts fire
- [ ] Ops DB role cannot read signing key material