# TASK ID: AUDIT-007.1
# TITLE: Self-audit fix #3: backup key escrow on Admin replacement
# STATUS: pending
# DEPENDENCIES: AUDIT-006.2
# ALLOWED FILES: docs/architecture/02-DECISIONS/ADR-012-backup-key-escrow.md
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
When Admin is replaced (new device), old encrypted backups need to be
re-encrypted or accessible. Without escrow, you lose access to history.

## WHY THIS WAS FOUND IN SELF-AUDIT
The original spec said backups are encrypted to the Admin's key. But
when you replace the Admin (laptop died, got stolen, person left
company), the new Admin can't decrypt old backups. This breaks the
"30 days of backups" promise.

## REQUIRED IMPLEMENTATION

Create `docs/architecture/02-DECISIONS/ADR-012-backup-key-escrow.md`:

```markdown
# ADR-012: Backup Key Escrow on Admin Replacement

## Status
Accepted, 2026-08-09

## Context

Backups are encrypted to the Admin's device key. This is great for
security — only the Admin can decrypt.

But: when the Admin device is replaced (broken, stolen, employee left),
the new Admin's key is different. The old backups become unreadable.

Without escrow, a clinic that replaces their Admin loses access to
their historical backups. This is unacceptable for any business
(legal, audit, patient history).

## Decision

We use **shared escrow via the Cloud** to enable Admin replacement
without losing backup access.

### Key hierarchy

1. **Project Key** (PK) — symmetric AES-256 key, generated when project created
2. **PK is wrapped (encrypted) with each authorized key**:
   - Current Admin's device public key (Ed25519 → X25519 for ECDH)
   - Cloud's escrow public key
3. **Backups are encrypted with PK**
4. **PK itself is never stored unwrapped anywhere**

### When Admin is replaced

1. Old Admin (or any authorized user) initiates replacement from a User app
2. Cloud verifies the request (Admin must be reachable to confirm OR
   7-day waiting period + email verification)
3. Old Admin's wrapped copy of PK is **destroyed** (logged)
4. New Admin generates new keypair, registers with Cloud
5. Cloud uses its escrow copy of PK to **re-wrap to new Admin's pubkey**
6. New Admin now has a wrapped copy of PK, can decrypt all old backups
7. Audit log records the full event chain

### What if Cloud is unavailable?

- New Admin cannot decrypt old backups until Cloud is back
- This is acceptable: customer's data is still on the old Admin's
  device (if they have it) or recoverable from snapshot in 7+ days
- Once Cloud is back, re-wrap happens

### What if Cloud itself is compromised?

- Attacker has the escrow key
- Attacker can decrypt backups IF they also have the backup blobs
- Backup blobs are in MinIO (encrypted at rest with Cloud's keys)
- So: full compromise requires both Cloud AND MinIO AND escrow key
- Mitigated by: 2FA on Cloud admin, separate credentials, audit log

### What if the customer wants zero escrow?

- Offer "Local plan with no Cloud": no backups at all, customer is
  responsible for their own snapshots
- Or: customer holds their own escrow key (printed paper key, 2FA)
- Tradeoff: customer can't recover if they lose the paper key
- This is opt-in, default is Cloud escrow

## Consequences

### Positive
- Admin can be replaced without losing backup access
- Customer has flexibility (escrow on Cloud, or self-custody)
- Compliance-friendly (we can prove access to backups)

### Negative
- Adds a dependency on Cloud for key recovery
- More complex than "Admin alone has the key"
- Paper-key option is operationally complex (loss, theft)

### Mitigations
- Cloud escrow is opt-out (default on for safety)
- Paper key is opt-in (for paranoid customers)
- Cloud is hardened per `THREAT-MODEL.md`

## Implementation notes

- Use libsodium `crypto_kx` for ECDH key exchange
- Use X25519 for encryption (convert from Ed25519)
- Wrapped PK stored in `project_keys` table in Cloud
- Audit every access to the escrow
```

## TESTS

```bash
cd /workspace
test -f docs/architecture/02-DECISIONS/ADR-012-backup-key-escrow.md || { echo "FAIL"; exit 1; }
grep -q "Escrow" docs/architecture/02-DECISIONS/ADR-012-backup-key-escrow.md || { echo "FAIL"; exit 1; }
echo "OK"
```
