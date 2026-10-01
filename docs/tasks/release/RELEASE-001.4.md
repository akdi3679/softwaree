# TASK ID: RELEASE-001.4
# TITLE: Add rollback procedure
# STATUS: pending
# DEPENDENCIES: RELEASE-001.3
# ALLOWED FILES: /workspace/docs/release/ROLLBACK.md
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Document the rollback procedure if a release breaks production.

## REQUIRED IMPLEMENTATION

Create `/workspace/docs/release/ROLLBACK.md`:

```markdown
# Rollback procedure

If a release breaks in production, we need to roll back. The strategy depends on the component.

## Admin / User app rollback

**Symptom**: Bad release, app crashes, critical feature broken.

**Mechanism**: Tauri updater is automatic. To force a downgrade:
1. Re-publish a previous good version to the update channel
2. Manually distribute via apt/dmg:
   ```bash
   # Linux
   apt install --allow-downgrades admin_0.1.4_amd64.deb
   # macOS: download old DMG, replace app
   ```
3. The next time the bad version checks for updates, it will see the older version and downgrade
4. The downgrade runs the new (old) version's migration on first launch

**Detection time**: Within 1h of release if we monitor the app start metric.
**Recovery time**: < 1h via channel switch.

## Cloud rollback

**Symptom**: Bad release, 5xx errors, data corruption risk.

**Mechanism**: Docker image + database migration
1. Roll back the Docker image:
   ```bash
   kubectl set image deployment/cloud cloud=product/cloud:v0.1.4
   ```
2. If a database migration ran, we have a problem. We must:
   - Restore the database from pre-migration backup
   - Apply the downgrade migration (we ship both up and down migrations)
3. Notify all admins of the rollback

**Detection time**: Within 5m via Prometheus alerts.
**Recovery time**: 15-30m including DB restore.

## Module rollback

**Symptom**: Bad module, all projects running it are broken.

**Mechanism**: Mark the bad version as deprecated in Cloud:
1. `POST /v1/modules/:id/versions/:v/deprecate` (Cloud admin)
2. New installations skip the bad version
3. Existing installations are notified; the Admin can choose to rollback (modules have a rollback command in the UI)

**Detection time**: Within 1h via audit log + module error reports.
**Recovery time**: < 1h.

## Database migrations

We use the up-and-down approach. Every migration has both:

```sql
-- 004_add_foo.up.sql
ALTER TABLE users ADD COLUMN foo TEXT;

-- 004_add_foo.down.sql
ALTER TABLE users DROP COLUMN foo;
```

The `down` migration is tested in CI as part of the migration round-trip test:
1. Apply up
2. Apply down
3. Apply up again
4. Verify state matches the after-first-up state

## Pre-release checklist

Before tagging a release:
- [ ] All migration `down` migrations tested
- [ ] Manual smoke test on Mac, Windows, Linux
- [ ] Backup verified in last 24h
- [ ] RPO < 24h
- [ ] On-call team aware
- [ ] Rollback commands documented
- [ ] Rollback link posted in #release channel
```

## TESTS

```bash
cd /workspace
test -f docs/release/ROLLBACK.md || { echo "FAIL"; exit 1; }
grep -q "Rollback" docs/release/ROLLBACK.md || { echo "FAIL"; exit 1; }
echo "OK"
```
