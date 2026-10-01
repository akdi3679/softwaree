# TASK ID: SUPPORT-001.2
# TITLE: Add support runbooks (common failures)
# STATUS: pending
# DEPENDENCIES: SUPPORT-001.1
# ALLOWED FILES: /workspace/docs/runbooks/SUPPORT.md
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
Document common support issues and how to debug them.

## REQUIRED IMPLEMENTATION

Create `/workspace/docs/runbooks/SUPPORT.md`:

```markdown
# Support runbook

Common support issues and how to debug them. Ops team only.

## "My User can't connect to the Admin"

**Symptoms**: User shows "Disconnected" banner.

**Debug**:
1. On the User device, run: `tailscale status`
2. Verify the Admin is in the tailnet: should see `[tag:admin] admin@<host>`
3. On the Admin, check if the sync server is running: `curl http://localhost:9420/health` should return OK (from a User device on the same tailnet)
4. On the Admin, check the metrics: `curl http://localhost:9090/metrics | grep admin_sync_clients_active`
5. If 0, no User is connected
6. Check Admin logs: `journalctl -u admin-app | grep -i "ws\|sync"`
7. Common causes:
   - Admin device sleeping (wake it)
   - our mesh disconnected (re-auth)
   - ACL change in our mesh config (re-deploy)
   - Admin on a different tailnet (move it)

## "The Admin says 'project not found'"

**Symptoms**: User can't open a project.

**Debug**:
1. On the Admin, check: `ls $DATA_DIR/projects/`
2. Look for the project_id: should be a directory
3. If absent, the project was archived
4. If present but unreadable, the SQLite file is corrupt
5. Run: `sqlite3 $DATA_DIR/projects/<id>.sqlite "PRAGMA integrity_check"`
6. If corrupt, restore from the most recent backup

## "Backup verification failed"

**Symptoms**: `Backup → Verify` shows `passed: false`.

**Debug**:
1. Check the SHA-256 mismatch detail
2. Possible causes:
   - Backup was corrupted in transit (rare; we use HTTPS)
   - Backup was tampered with (very bad; investigate)
   - The passphrase is wrong (re-try with the original)
   - The Admin's device key was changed (re-encrypt with the new key — the backup is still valid)
3. If the SHA-256 is the same on the Cloud and locally, the data is intact
4. If different, the backup is unusable; we cannot recover it

## "Events not syncing to a User"

**Symptoms**: User sees stale data.

**Debug**:
1. Check the User's last applied sequence in the audit log
2. Compare with the Admin's latest sequence
3. If gap is < 5000, the sync should work
4. If gap > 5000, a snapshot is needed — User should request a snapshot
5. Force a snapshot: on the User, click "Sync now"

## "Module install failed"

**Symptoms**: Triple-signature verification error.

**Debug**:
1. The Cloud's signature must verify
2. The project license must match this project
3. The device bind must match this device's key
4. If any fails:
   - Cloud signature invalid: the module was tampered with — DO NOT INSTALL
   - Project license mismatch: the module is for a different project — wrong package
   - Device bind mismatch: the device key was rotated — re-download the module

## "User forgot their password"

**Symptoms**: User can't log in.

**Resolution**:
1. Password reset is an Admin responsibility
2. Admin: Go to Users → select user → "Reset password"
3. The Admin sets a new temporary password
4. The User logs in and changes it

**Self-serve password reset** is not in v1. Plan 2 will add it (out-of-band email link).

## "An Admin is offline and the Users need to write"

**Reality**: In v1, this is not possible. Users are strictly read-only. Writes are blocked.

**Workaround**:
- Wait for the Admin to come back online
- OR transfer ownership: Admin can hand off the device key to another machine (emergency procedure, requires offline admin to do it)

**For v2**: We'll add an OFFLINE_QUEUEABLE flag per command. In the meantime, accept that writes require the Admin.

## "The Cloud is down"

**Symptoms**: Admin can't fetch new modules, can't invite new users, can't check licenses.

**Reality**: The Admin's existing data is unaffected (it's local). Users keep working (they sync from the Admin, not the Cloud).

**Recovery**:
1. Check the Cloud's metrics: `curl cloud.tailnet:8787/health`
2. If unreachable, SSH into the Cloud VM
3. Check Docker: `docker ps` — is the cloud container running?
4. Check Postgres: `docker exec cloud-postgres pg_isready`
5. If all good, the issue is the network (our mesh down?)
6. Re-establish our mesh; the Cloud will be back

## "The mesh is down"

**Symptoms**: Devices can't authenticate to the tailnet.

**Reality**: Existing connections keep working (WireGuard uses cached state). New connections fail.

**Recovery**:
1. SSH into the Cloud VM running the discovery service
2. `systemctl status headscale`
3. If down, restart: `systemctl restart headscale`
4. Check logs: `journalctl -u headscale`
5. If Postgres is down, restore from backup (the Cloud has daily Postgres backups)

## On-call

- Primary on-call: PagerDuty → Pager rotation
- Escalation: engineering lead → CTO
- Off-hours: 30 minutes response time
- During work hours: 5 minutes
```

## TESTS

```bash
cd /workspace
test -f docs/runbooks/SUPPORT.md || { echo "FAIL"; exit 1; }
grep -q "Support runbook" docs/runbooks/SUPPORT.md || { echo "FAIL"; exit 1; }
grep -q "mesh" docs/runbooks/SUPPORT.md || { echo "FAIL: no mesh"; exit 1; }
echo "OK"
```
