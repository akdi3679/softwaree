# Cloud Runbook

## Quick reference

| Issue | First step |
|---|---|
| 5xx spike | check pm2 logs |
| Postgres slow | pg_stat_activity |
| MinIO down | check minio logs |
| Mesh auth | check discovery service |
| Stripe webhook failing | Stripe dashboard, Events |

## Common scenarios

### 1. Cloud returning 503
1. curl https://api.example.com/health - is /health OK?
2. If /health down, whole app is down. Check process: pm2 list
3. If /health OK, check recent deploys: git log --oneline -5
4. If recent deploy is bad: pm2 restart cloud
5. If still bad: rollback (see docs/release/ROLLBACK.md)
6. Page on-call if SEV-1

### 2. Postgres slow
1. SELECT pid, state, query, duration FROM pg_stat_activity ORDER BY duration DESC LIMIT 20;
2. Kill long queries: SELECT pg_terminate_backend(pid);
3. If a specific query is slow, check for missing index
4. Check connection count: SELECT count(*) FROM pg_stat_activity;
5. If at max connections (100): scale up
6. Check disk: df -h

### 3. Postgres disk full
1. df -h and psql -c "SELECT pg_database_size('product_dev');"
2. If backups fill disk: clean old ones
3. If event_journal: archive (do not delete - it is the audit trail)
4. If customers complain, escalate

### 4. MinIO unreachable
1. Check MinIO process: ps aux | grep minio
2. Check disk: df -h /var/lib/minio
3. Check network: nc -z minio.example.com 9000
4. Restart: systemctl restart minio
5. If buckets corrupted: restore from snapshot

### 5. Stripe webhook failed
1. Stripe dashboard, Developers, Webhooks, Logs
2. Find the failed event, click Resend
3. If still failing, check our signature verification logic
4. If the event is older than 7 days, we missed it - manually reconcile

### 6. Mesh issue
1. Check discovery service: systemctl status product-discovery
2. List devices (ops console)
3. Re-auth a device if its key was rotated

### 7. Customer cannot log in
1. Check account state: support-cli account look-up EMAIL
2. If state is pending_deletion: customer has 30 days to recover
3. If state is active: ask for IP, check audit log for failed logins
4. If 5+ failed logins: account is temporarily locked, wait 30 min
5. If email not verified: resend verification

### 8. Customer data missing
1. Check if account is archived (read-only, restorable)
2. Check if account is pending_deletion (gone in 30 days, recoverable)
3. Check if account is deleted (gone, but we have backups)
4. If we have backups: see DR runbook

### 9. High memory on Cloud VM
1. Check processes: top -o %MEM
2. If Node.js: check for memory leaks (heap snapshot)
3. If Postgres: see item 2 above
4. If MinIO: check cache size

### 10. Disk full on Cloud VM
1. df -h
2. du -sh /var/log/* - old logs?
3. journalctl --vacuum-size=100M
4. Postgres archives: find /var/lib/postgresql -name "*.gz" -mtime +7 -delete
5. Old backups: see BACKUP.md

## On-call

- Slack: #incidents
- PagerDuty: product-oncall
- Escalation: CTO, then CEO

## Dashboards

- Cloud: https://grafana.example.com/d/cloud
- Postgres: https://grafana.example.com/d/pg
- MinIO: https://grafana.example.com/d/minio
- Stripe: https://dashboard.stripe.com

## Related runbooks

- DR: docs/runbooks/DR.md
- Backup: docs/runbooks/BACKUP.md
- Support: docs/support/TRAINING.md
- Release: docs/release/ROLLBACK.md