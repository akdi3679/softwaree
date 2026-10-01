# TASK ID: COMMUNICATION-001.3
# TITLE: Add our mesh ACL config (for ops reference)
# STATUS: pending
# DEPENDENCIES: COMMUNICATION-001.2
# ALLOWED FILES: /workspace/internal-infra/headscale/acl.yaml
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Document the our mesh ACL config. Applied to both tailnets.

## REQUIRED IMPLEMENTATION

Create `/workspace/internal-infra/headscale/acl.yaml`:

```yaml
# Our mesh ACL policy
# Applied to BOTH project and ops tailnets
# See: https://tailscale.com/kb/1018/acls/

# Default: deny all
acls:
  # ===== Project tailnet =====
  - action: accept
    src:
      - "tag:admin"
    dst:
      - "tag:user:9420"  # WebSocket sync
      - "tag:user:9090"  # Metrics
  - action: accept
    src:
      - "tag:user"
    dst:
      - "tag:admin:9420"
      - "tag:admin:9090"
  - action: accept
    src:
      - "tag:admin"
    dst:
      - "tag:cloud:443"  # License check
      - "tag:cloud:8787"  # Module delivery

  # ===== Ops tailnet =====
  - action: accept
    src:
      - "tag:ops"
    dst:
      - "tag:cloud:22"   # SSH
      - "tag:cloud:8787" # HTTP API
  - action: accept
    src:
      - "tag:ci"
    dst:
      - "tag:cloud:8787"

# Tag owners (who can assign the tag)
tagOwners:
  tag:admin:
    - "group:admins"
  tag:user:
    - "group:admins"
  tag:ops:
    - "group:ops"
  tag:ci:
    - "group:ci"
  tag:cloud:
    - "group:ops"

# Tests: validate ACLs (our discovery service runs these on startup)
tests:
  - name: "admin-can-sync-to-user"
    src: "tag:admin"
    dst: "tag:user"
    accept: ["tag:user:9420"]
  - name: "user-can-connect-to-admin"
    src: "tag:user"
    dst: "tag:admin"
    accept: ["tag:admin:9420"]
  - name: "user-cannot-ssh-to-admin"
    src: "tag:user"
    dst: "tag:admin"
    accept: []
  - name: "admin-cannot-ssh-to-user"
    src: "tag:admin"
    dst: "tag:user"
    accept: []
```

Create `/workspace/internal-infra/headscale/config.yaml`:

```yaml
# Our discovery service config — used for both networks
server_url: https://headscale.product.local
listen_addr: 0.0.0.0:443
metrics_listen_addr: 0.0.0.0:9090
grpc_listen_addr: 0.0.0.0:50443
grpc_allow_insecure: false

database:
  type: postgres
  host: 127.0.0.1
  port: 5432
  name: headscale
  user: headscale
  pass: ${HEADSCALE_DB_PASSWORD}

# Two separate headscale instances, one per tailnet
# (run in different Docker containers with different DBs)
```

## TESTS

```bash
cd /workspace
test -f internal-infra/headscale/acl.yaml || { echo "FAIL"; exit 1; }
test -f internal-infra/headscale/config.yaml || { echo "FAIL: no config"; exit 1; }
grep -q "tag:admin" internal-infra/headscale/acl.yaml || { echo "FAIL: no admin tag"; exit 1; }
echo "OK"
```
