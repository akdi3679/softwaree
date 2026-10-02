# Rollback procedure

If a release breaks production, roll back. Strategy depends on the component.

## Admin / User app rollback

Symptom: bad release, app crashes, critical feature broken.

Mechanism: Tauri updater is automatic. To force a downgrade:
1. Re-publish a previous good version to the update channel
2. Manual distribution (apt install --allow-downgrades / replace DMG)
3. Next update check sees older version and downgrades
4. Downgrade runs migrations on first launch

Detection: 1h if we monitor app start metric. Recovery: < 1h.

## Cloud rollback

Symptom: bad release, 5xx errors, data corruption risk.

Mechanism: Docker image + database migration
1. Roll back the Docker image
2. If a DB migration ran, restore from pre-migration backup and apply the down migration
3. Notify all admins

Detection: 5m via Prometheus alerts. Recovery: 15-30m.

## Module rollback

Symptom: bad module, all projects running it are broken.

Mechanism: deprecate the bad version in Cloud
1. POST /v1/modules/:id/versions/:v/deprecate (ops role)
2. New installations skip the bad version
3. Existing installations are notified; Admin can rollback

Detection: 1h via audit + module error reports. Recovery: < 1h.

## Database migrations

Every migration has up and down:

    004_add_foo.up.sql   -> ALTER TABLE users ADD COLUMN foo TEXT;
    004_add_foo.down.sql -> ALTER TABLE users DROP COLUMN foo;

CI tests the round-trip: up, down, up again, verify state.

## Pre-release checklist

- All down migrations tested
- Manual smoke test on Mac, Windows, Linux
- Backup verified in last 24h
- RPO < 24h
- On-call team aware
- Rollback commands documented
- Rollback link posted in #release channel
