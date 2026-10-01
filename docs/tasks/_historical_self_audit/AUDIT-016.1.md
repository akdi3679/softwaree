# TASK ID: AUDIT-016.1
# TITLE: Self-audit fix #12: GDPR right to be forgotten + backups
# STATUS: pending
# DEPENDENCIES: AUDIT-015.2
# ALLOWED FILES: docs/compliance/GDPR-FORGETTING.md
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
GDPR Article 17 says: "right to be forgotten". When a customer
requests deletion, we must delete ALL their data, including backups.

The previous spec was unclear on backups. This ADR fixes it.

## WHY THIS WAS FOUND IN SELF-AUDIT
The original GDPR contract task was high-level. The interaction
between "delete all data" and "30 days of backups" was not specified.
This is a real risk: we say we deleted, but backups still have the data.

## REQUIRED IMPLEMENTATION

Create `docs/compliance/GDPR-FORGETTING.md`:

```markdown
# GDPR Right to Be Forgotten — Including Backups

## The principle

When a customer requests deletion, ALL their personal data must be
deleted — including from backups.

This is harder than it sounds. Backups are immutable blobs. We can't
go in and "edit" a backup. We have to either:

1. Wait for the backup to age out (30 days)
2. Encrypt the backup in a way that becomes unreadable when we delete the key (cryptographic erasure)
3. Re-write the backup to exclude the data (expensive)

## Decision

We use **cryptographic erasure** (option 2).

### How it works

1. Project data is encrypted with the project key (PK)
2. PK is wrapped with:
   - Admin's device public key
   - Cloud's escrow public key
3. When customer requests deletion:
   - Cloud generates a new "deletion marker" in the customer's account
   - All new backups after this marker do NOT include the customer's project
   - Old backups (within 30 days) are encrypted with PK, which we now destroy
4. **We destroy the wrapped copies of PK** (both Admin and escrow)
5. Old backups become mathematically unrecoverable
6. After 30 days, those backups age out and are physically deleted
7. Within 30 days, the backups exist but are unreadable

This is the **industry-standard** approach (used by AWS S3 Object Lock,
Azure Immutable Blob, etc.) and accepted by EU DPAs.

## What gets deleted

| Data | When | How |
|---|---|---|
| Cloud account | Immediately | Hard delete in Postgres |
| Cloud-side metadata (project name, etc.) | Immediately | Hard delete |
| Active SQLite in Admin | Immediately | Customer-side: they uninstall |
| Active SQLite in any User app | Within 24h | Auto-purge on next sync |
| Recent backups (0-30 days) | Within 30 days | Cryptographic erasure + physical delete after aging out |
| Audit log in Cloud | Immediately | Hard delete |
| Stripe data | Per Stripe's policy (~7 years for tax) | Stripe handles |
| Support tickets | Immediately | Hard delete (except for legal hold) |
| Marketing email list | Immediately | Unsubscribe |
| Analytics | Within 7 days (batched) | Anonymization in next warehouse ETL |
| Logs (in Sentry, Grafana) | Within 30 days | Retention policy |
| Backups in MinIO | Within 30 days (age out) | Physical delete after crypto-erase |

## What we DON'T delete

- **Stripe financial records** — required for tax law (7 years)
- **Anonymized analytics** — no personal data, kept for product improvement
- **Aggregated metrics** — e.g., "100 customers used the medical module in Q3"
- **Legal hold records** — if there's a lawsuit, we keep what's required

## What we tell the customer

> "Your data has been deleted. We have removed your account, all
> projects, all backups, and all support history. Financial records
> with Stripe are kept for 7 years per tax law — they don't contain
> your medical or food-lab data. Anonymized usage data may be kept
> for product improvement."

## What we tell the regulator (if asked)

We can demonstrate:
- ✅ Account deleted from Postgres
- ✅ Project key destroyed (audit log entry: "key destroyed at T")
- ✅ Backups aged out and physically deleted (log entry per backup)
- ✅ Audit log shows the deletion chain
- ✅ Time from request to full deletion: < 30 days

## Edge cases

### Customer cancels but asks for export first
1. Customer exports their data (Settings → Data → Export)
2. We verify export is complete
3. Customer confirms "I have my data, proceed with deletion"
4. We proceed with deletion as above

### Customer is mid-project
1. Same as above, but they may have active backups
2. We delete within 30 days (after the most recent backup ages out)

### Customer is in litigation
1. We may need to keep data (legal hold)
2. Lawyer makes the call
3. Document the hold, the scope, the duration

### Customer requests "undelete"
- Within 30 days: possible (we can re-derive the project key from escrow)
- After 30 days: not possible. Crypto-erase is permanent.

This is why we have a 30-day grace period after cancellation (see
account state: `pending_deletion`).

## Tests

- [ ] Customer requests deletion
- [ ] Verify Cloud account is deleted within 1 minute
- [ ] Verify Admin's local data is purged on next sync
- [ ] Verify backups are unreadable within 1 minute (destroy keys)
- [ ] Verify backups are physically deleted within 30 days
- [ ] Verify export was generated (if requested)
- [ ] Verify customer receives email confirmation
```

## TESTS

```bash
cd /workspace
test -f docs/compliance/GDPR-FORGETTING.md || { echo "FAIL"; exit 1; }
grep -q "Cryptographic" docs/compliance/GDPR-FORGETTING.md || { echo "FAIL"; exit 1; }
echo "OK"
```
