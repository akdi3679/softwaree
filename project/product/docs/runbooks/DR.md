# Disaster Recovery Runbook

> **Status:** Active
> **Owner:** ops team
> **On-call severity:** P1 (page immediately)

What to do when the Cloud, the Admin fleet, or the backup store is
degraded or destroyed. Read top-to-bottom on first invocation; use the
"Cheat sheet" at the top on subsequent invocations.

---

## Cheat sheet

    Cloud DB down                -> Section 2.1
    Cloud API down, DB up        -> Section 2.2
    Cloud VM lost entirely       -> Section 2.3
    MinIO backup store lost      -> Section 3.1
    Single project's Admin lost  -> Section 4.1
    Discovery service down       -> Section 5.1
    Audit chain divergence       -> Section 6.1
    Suspected compromise         -> Section 7.1

Escalation: ping #ops on Slack. If no response in 10 minutes, call the
on-call number in `docs/operations/ON-CALL.md`.

---

## 1. Common preamble

Before anything else:

1. Confirm scope. Is it one project or the whole Cloud?
2. Confirm data loss. Any business data at risk, or only control plane?
3. Declare. Post the incident channel and start a timestamped log.
4. Freeze. Stop any deploy pipeline touching the affected system.

**Rule:** never apply a fix you cannot roll back within 5 minutes. If
the fix is bigger, take a snapshot first.

---

## 2. Cloud failures

### 2.1 Cloud DB down

**Symptoms:** `/health` returns `db_reachable: false`. All API calls 500.

Steps:

1. Check Postgres process: `docker compose ps postgres` (or the managed
   service status).
2. Check disk space. Postgres dies on full disk.
3. If restart is safe, restart. If not, restore from the most recent
   logical backup:
   - `psql $DATABASE_URL < latest_dump.sql`
4. Verify `/ready` returns 200.
5. Post-mortem: write to `docs/runbooks/incidents/<date>-pg-down.md`.

### 2.2 Cloud API down, DB up

**Symptoms:** no response on `/health`. DB logs show no connection
attempts.

Steps:

1. Check the API container: `docker compose logs api --tail=200`.
2. Most likely cause: bad deploy. Roll back:
   - `git -C platform-cloud log --oneline -5`
   - `git -C platform-cloud revert <bad-sha>`
   - Redeploy via Woodpecker.
3. If the process is up but unresponsive, restart the container.
4. If auth middleware is the failure point, disable it temporarily via
   env `AUTH_BYPASS=true` ONLY on an internal endpoint. Never on `/v1/*`.

### 2.3 Cloud VM lost entirely

Steps:

1. Provision a new VM from the infra Terraform in
   `internal-infra/deploy/`.
2. Restore secrets from Infisical (`infisical export`).
3. Restore the Postgres DB from the last logical dump.
4. Restore MinIO from the object-store snapshot.
5. Update DNS. Bump TTL to 60s beforehand if there was warning.
6. Verify `/health` and `/ready`.
7. Broadcast to customers via the status page.

Expected RTO: 2-4 hours. Expected RPO: last logical dump (<= 1 hour).

---

## 3. Backup store

### 3.1 MinIO lost

Backups are the only copy of customer data outside the Admin device.
Losing them is a serious event.

Steps:

1. Confirm the loss. Is it the whole bucket or one shard?
2. If a shard is intact, the S3-compatible API may still serve.
3. If the whole bucket is lost:
   - Notify every affected customer. The Admin's local backup (or the
     project DB itself) is now the sole copy.
   - Assist customers in taking a fresh encrypted backup once MinIO is
     restored.
   - Do NOT delete any Admin data.
4. Bring up a new MinIO instance backed by durable storage.

---

## 4. Admin-side failures

### 4.1 Single project's Admin lost

The Admin device holds the only authoritative copy of a project's data.

Steps:

1. Confirm with the customer that the device is unrecoverable.
2. Locate the most recent encrypted backup for the project
   (`GET /v1/projects/:id/backups`, sorted by `taken_at`).
3. The customer must authorize recovery (they hold the project
   recovery key, or the escrow key is used). Both paths are in
   `docs/runbooks/FIRST-CUSTOMER.md`.
4. On a new device:
   - Install the Admin app.
   - Sign in with the customer's account.
   - Enter recovery mode.
   - Provide the recovery key or authorize escrow use.
   - Download the backup, decrypt, restore.
5. Verify: the new device shows the same project state as of the backup
   timestamp. Note the lost window (events after the backup).
6. Audit the recovery event.

RTO: 30-60 minutes. RPO: last backup (<= 1 day for daily plan).

---

## 5. Discovery service

### 5.1 Discovery down

**Symptoms:** `GET /v1/discovery/lookup` fails or returns 5xx.

Impact: WAN sync falls back to hole-punching; LAN sync unaffected.

Steps:

1. Restart the discovery route (part of the main API).
2. If the DB is the issue, see 2.1.
3. If a bad migration broke the schema, roll it back:
   - `SELECT version FROM schema_version ORDER BY version DESC LIMIT 5;`
   - `DELETE FROM schema_version WHERE version = <bad>;`
   - Restore the missing table.
4. Verify: send a test heartbeat from a dev device.

RTO: 15 minutes. RPO: none (metadata only; devices re-heartbeat).

---

## 6. Integrity

### 6.1 Audit chain divergence detected

**Symptoms:** `cloud_audit_chain_valid == 0` alerts.

This is a security incident. Do not attempt to "fix" the chain.

Steps:

1. Freeze the affected environment.
2. Identify the broken entry: `verifyChain()` returns `brokenAt`.
3. Check what changed just before that entry:
   - Query `audit_entries` for entries within 10 minutes of the broken
     entry.
   - Correlate with deploy history.
4. If the divergence is due to a legitimate migration or bug, write it
   up and re-baseline (with sign-off from two engineers).
5. If the divergence is not explainable, treat as compromise (Section 7).

---

## 7. Security

### 7.1 Suspected compromise

Steps:

1. Rotate every secret in Infisical.
2. Rotate the Cloud root signing key.
3. Invalidate all sessions: `UPDATE sessions SET is_revoked='true' WHERE is_revoked='false';`
4. Force device re-registration for any affected account.
5. Notify affected customers.
6. Preserve all logs; do not delete anything.
7. Engage the external pen-test team (contact in
   `docs/security/PEN-TEST-REQUEST.md`).

---

## 8. Post-incident

Every incident produces a written post-mortem within 5 business days:

- Timeline (with UTC timestamps)
- Impact (customers, data, downtime)
- Root cause
- Detection: how we found out
- Response: what we did
- Prevention: what changes prevent recurrence
- Follow-ups with owners and dates

Store in `docs/runbooks/incidents/<date>-<slug>.md`.

---

## 9. Testing the runbook

Quarterly drill. Pick one scenario at random. Walk it in a staging
environment. Note deviations. Update this document.