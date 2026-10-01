# TASK ID: AUDIT-015.1
# TITLE: Self-audit fix #11: backup verification (actually test backups)
# STATUS: pending
# DEPENDENCIES: AUDIT-014.2
# ALLOWED FILES: docs/operations/BACKUP-VERIFICATION.md
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Backups that aren't tested are wishes, not backups. Add a verification
process that proves backups can be restored.

## WHY THIS WAS FOUND IN SELF-AUDIT
The spec said "daily backups" but didn't say how we know they work.
A backup is only a backup if you can restore from it. We need:
- Automated verification (every backup)
- Manual restore drill (every month)
- Customer-facing backup status

## REQUIRED IMPLEMENTATION

Create `docs/operations/BACKUP-VERIFICATION.md`:

```markdown
# Backup Verification

## The principle

A backup is only a backup if you can restore from it.

A backup that has never been tested is a wish, not a backup.

## Three layers of verification

### Layer 1: Automated (every backup)

When a backup is created (daily, weekly, or hourly):

1. **Size check**: backup size > 0 KB, < 10 GB
2. **Checksum**: SHA-256 of the backup file, stored alongside
3. **Decryption test**: decrypt with project key, verify it parses
4. **Schema check**: SQLite file has expected tables
5. **Row count check**: key tables (patients, visits, events) have rows
   that match what's in Admin's live SQLite
6. **Latency check**: backup completes in < 5 minutes (else alert)

If any check fails:
- Mark backup as "failed"
- Page on-call
- Customer sees red "Backup failed" in their dashboard
- Auto-retry in 1 hour, max 3 retries

### Layer 2: Restore drill (monthly, automated)

Once a month, on a random backup:

1. **Pick a random backup** from a random customer
2. **Download it** to a sandbox environment
3. **Decrypt it** with the project key (in escrow, see ADR-012)
4. **Restore it** to a fresh SQLite file
5. **Run a query suite** against the restored data
6. **Compare** with the original Admin's data (last 7 days)
7. **Generate report**: "Backup X restored successfully, N rows match"
8. **If any mismatch**: alert immediately

This is a "GameDay" exercise. It's automated, runs the first Sunday
of every month. Takes 30-60 minutes.

### Layer 3: Customer-driven (on demand)

Customers can verify their own backup:

1. **Settings → Backups → "Verify now"**
2. Admin triggers a restore to a sandbox
3. Customer sees report: "Last backup verified on [date]"
4. Customer can also download a copy of any backup

## What we show the customer

In the Admin's Backup page:

```
Last backup: 2026-08-09 03:00 (6 hours ago)
Last verified: 2026-08-09 03:05 (6 hours ago)
Status: ✅ Verified
Size: 42 MB
Encrypted to: Your device key + Cloud escrow
Download: [link]
Restore: [request restore]
```

If the verification failed:

```
Last backup: 2026-08-09 03:00 (6 hours ago)
Last verified: 2026-08-09 03:05 (6 hours ago)
Status: ❌ FAILED to decrypt
Action: Contact support immediately
```

## Recovery procedures

### Backup failed to upload
- Retry 3x
- If still fails: alert
- If customer's network is bad: queue for next attempt
- If our MinIO is down: alert ops

### Backup uploaded but verification failed
- This is critical
- Could be: data corruption, key mismatch, our bug
- Page on-call
- Customer sees red status
- Offer to immediately try a fresh backup

### Customer reports data loss
1. We check last successful backup
2. We trigger restore to customer's Admin
3. Customer reviews the restored data
4. Customer confirms: "yes, restore this as the new state"
5. New events are still in event_store (if intact)
6. We replay any events that were missed

## KPIs

- Backup success rate: target 99.9%
- Verification pass rate: target 100%
- Restore drill success rate: target 100% (or page immediately)
- Time to restore: target < 30 minutes
- Time to first backup after signup: target < 1 hour

## What we DON'T do

❌ Store backups unencrypted (compliance violation)
❌ Delete old backups without 30-day retention
❌ Trust customer that "the backup is fine" — always verify
❌ Test backups only in dev (must test in prod)
❌ Skip the monthly drill (it's the most important one)
```

## TESTS

```bash
cd /workspace
test -f docs/operations/BACKUP-VERIFICATION.md || { echo "FAIL"; exit 1; }
grep -q "Verify" docs/operations/BACKUP-VERIFICATION.md || { echo "FAIL"; exit 1; }
echo "OK"
```
