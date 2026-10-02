# Metrics & Observability

> **Status:** Active
> **Audience:** anyone adding a metric, alert, or dashboard
> **Related:** 03-STACK.md (section E)

Every metric the platform exposes, its type, its purpose, and the alert
threshold. All metrics follow the Prometheus convention:

    <namespace>_<subsystem>_<name>_<unit>

Namespace: `product_` for app metrics, `cloud_` for Cloud metrics.

---

## 1. Admin app metrics (`product_`)

Exposed via `apps/admin/src-tauri/src/observability/metrics.rs` on a
local Prometheus HTTP endpoint (default `0.0.0.0:9090`, mesh-only in prod).

### Command execution

| Metric | Type | Labels | Purpose |
|---|---|---|---|
| `product_commands_total` | counter | `command`, `result` | Count of commands executed, by outcome |
| `product_command_duration_seconds` | histogram | `command` | Latency of command execution |
| `product_command_errors_total` | counter | `command`, `error_code` | Command failures by category |

Alert: `rate(product_command_errors_total{error_code="INTERNAL"}[5m]) > 0.1`
for 10 minutes.

### Events

| Metric | Type | Labels | Purpose |
|---|---|---|---|
| `product_events_appended_total` | counter | `event_type`, `aggregate_type` | Event throughput |
| `product_event_append_duration_seconds` | histogram | - | Per-event write latency |
| `product_outbox_dispatch_lag_seconds` | gauge | - | Age of oldest unshipped outbox row |

Alert: `product_outbox_dispatch_lag_seconds > 300` for 5 minutes.

### Sync

| Metric | Type | Labels | Purpose |
|---|---|---|---|
| `product_sync_clients_active` | gauge | `transport` | Connected User apps |
| `product_sync_frames_total` | counter | `frame_type`, `direction` | Frame throughput |
| `product_sync_bytes_total` | counter | `direction` | Byte throughput |
| `product_sync_gaps_detected_total` | counter | - | Snapshot-triggered recoveries |

Alert: `product_sync_clients_active == 0` while a project has Users -
could mean the mesh is down.

### Modules

| Metric | Type | Labels | Purpose |
|---|---|---|---|
| `product_module_load_duration_seconds` | histogram | `module_id` | Wasmtime instantiation |
| `product_module_invocations_total` | counter | `module_id`, `command`, `result` | Module call throughput |
| `product_module_fuel_consumed` | histogram | `module_id` | Wasmtime fuel per call |

Alert: `rate(product_module_invocations_total{result="error"}[5m]) > 1`.

### HTTP (metrics server itself)

| Metric | Type | Labels | Purpose |
|---|---|---|---|
| `product_http_request_duration_seconds` | histogram | `path`, `method`, `status` | Metrics server latency |

---

## 2. Cloud metrics (`cloud_`)

Exposed via `platform-cloud/apps/api/src/metrics/` on `/metrics`.

### HTTP

| Metric | Type | Labels | Purpose |
|---|---|---|---|
| `cloud_http_requests_total` | counter | `route`, `method`, `status` | Request throughput |
| `cloud_http_request_duration_seconds` | histogram | `route`, `method` | Request latency |
| `cloud_http_5xx_rate` | gauge | `route` | Rolling 5xx rate |

Alert: `cloud_http_5xx_rate > 0.01` for 5 minutes.

### Database

| Metric | Type | Labels | Purpose |
|---|---|---|---|
| `cloud_db_connections_active` | gauge | - | Open Postgres connections |
| `cloud_db_query_duration_seconds` | histogram | `query_type` | DB latency |
| `cloud_db_replica_lag_seconds` | gauge | `replica` | Read replica lag (Stage 3+) |

Alert: `cloud_db_connections_active > 80% of pool` for 5 minutes.

### Auth

| Metric | Type | Labels | Purpose |
|---|---|---|---|
| `cloud_auth_attempts_total` | counter | `result` | Login attempts |
| `cloud_auth_locked_total` | counter | - | Account lockouts triggered |
| `cloud_session_rotations_total` | counter | `reason` | Forced session invalidations |

Alert: `rate(cloud_auth_locked_total[5m]) > 5` (possible brute-force wave).

### Audit

| Metric | Type | Labels | Purpose |
|---|---|---|---|
| `cloud_audit_entries_total` | counter | `category`, `result` | Audit writes |
| `cloud_audit_chain_valid` | gauge | - | 1 if verifyChain passes, 0 otherwise |

Alert: `cloud_audit_chain_valid == 0` - immediate page (chain tamper).

### Backups

| Metric | Type | Labels | Purpose |
|---|---|---|---|
| `cloud_backups_received_total` | counter | `kind`, `result` | Backup uploads |
| `cloud_backup_size_bytes` | histogram | `kind` | Backup sizes |
| `cloud_backup_age_seconds` | gauge | `project_id` | Age of latest backup per project |

Alert: `cloud_backup_age_seconds{plan!="local"} > 86400*1.5` - daily
backups are late.

### Discovery

| Metric | Type | Labels | Purpose |
|---|---|---|---|
| `cloud_discovery_heartbeats_total` | counter | `state` | Heartbeat traffic |
| `cloud_discovery_lookups_total` | counter | `result` | Lookup traffic |
| `cloud_discovery_stale_rows` | gauge | - | Rows older than 30 minutes |

Alert: `cloud_discovery_stale_rows > 1000` - many devices offline.

### Stripe

| Metric | Type | Labels | Purpose |
|---|---|---|---|
| `cloud_stripe_webhooks_total` | counter | `event_type`, `result` | Webhook ingestion |
| `cloud_stripe_webhook_duration_seconds` | histogram | `event_type` | Webhook processing time |

Alert: `rate(cloud_stripe_webhooks_total{result="error"}[5m]) > 0.1`.

---

## 3. Cluster health

| Metric | Type | Labels | Purpose |
|---|---|---|---|
| `cloud_cluster_nodes_active` | gauge | - | Nodes sending heartbeats |
| `cloud_instance_uptime_seconds` | gauge | `instance_id` | Per-instance uptime |
| `cloud_instance_memory_bytes` | gauge | `instance_id` | RSS |
| `cloud_instance_cpu_load_1m` | gauge | `instance_id` | 1-minute load average |

Alert: `cloud_cluster_nodes_active < desired_count` for 2 minutes.

---

## 4. Log structure

All logs are JSON. Fields:

- `timestamp` (RFC3339)
- `level` (info / warn / error)
- `target` (module path)
- `message`
- `correlation_id` (UUID tying logs to a request)
- `account_id`, `user_id`, `device_id` (when applicable)
- `error_code` (when a log accompanies an error)

**Rule:** never log `password`, `token`, `secret`, `authorization`,
`private_key`, or full PII event payloads. The `redact` module in
`platform-cloud/apps/api/src/lib/redact.ts` enforces this at the logger
formatter level. In Rust, use `tracing` fields and manually exclude
sensitive values.

---

## 5. Tracing

OpenTelemetry spans are exported to Tempo (via the OTLP collector).

- Cloud: `platform-cloud/apps/api/src/tracing/init.ts`
- Admin: `apps/admin/src-tauri/src/observability/trace.rs`

Span naming: `<subsystem>.<operation>`.

    cloud.http.request
    cloud.db.query
    admin.command.execute
    admin.sync.frame
    admin.module.invoke

Trace context propagates from inbound requests via the `traceparent`
header. The Admin app attaches a fresh context at the boundary where a
sync frame enters.

---

## 6. Grafana dashboards

Provisioned in `internal-infra/grafana/dashboards/`:

- `admin.json` - per-Admin health, command throughput, module invocations
- `cloud.json` - Cloud API health, DB latency, auth, backups
- `security.json` - brute-force rate, audit chain, session rotations
- `sync.json` - mesh health, per-device connectivity

---

## 7. Alert routing

- **P1 (page):** audit chain invalid, DB down, discovery service down,
  > 5% 5xx rate.
- **P2 (Slack):** auth lockout wave, backup overdue, cluster node down.
- **P3 (ticket):** individual command errors, slow queries.

Every alert has a runbook under `docs/runbooks/`.

---

## 8. Cardinality discipline

**Rule:** never use unbounded labels. `project_id`, `user_id`,
`device_id` are unbounded and must NOT be Prometheus labels. Aggregate
them; if per-device data is needed, use a separate metrics store
(e.g. ClickHouse via the warehouse ETL).

Allowed labels: `command`, `event_type`, `route`, `status`, `result`,
`transport`, `module_id`, `plan`, `state`, `direction`, `error_code`.

---

## 9. Testing metrics

New metrics must have:

- A corresponding test that increments the counter and reads it back.
- A line in this file.
- An alert rule in `internal-infra/prometheus/alerts.yml` if the metric
  is critical.