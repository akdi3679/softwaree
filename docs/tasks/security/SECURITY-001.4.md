# TASK ID: SECURITY-001.4
# TITLE: Add CSP and URL allowlist for Admin Tauri
# STATUS: pending
# DEPENDENCIES: SECURITY-001.3
# ALLOWED FILES: product/apps/admin/src-tauri/tauri.conf.json
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Tighten CSP for Admin Tauri. Allow only Tailnet and Cloud URLs in fetch.

## REQUIRED IMPLEMENTATION

Update `product/apps/admin/src-tauri/tauri.conf.json` `app.security` section:

```json
{
  "app": {
    "security": {
      "csp": {
        "default-src": "'self'",
        "script-src": "'self'",
        "style-src": ["'self'", "'unsafe-inline'"],
        "img-src": ["'self'", "data:", "https://*.product.local"],
        "font-src": ["'self'", "data:"],
        "connect-src": [
          "'self'",
          "ipc:",
          "http://ipc.localhost",
          "https://cloud.product.local",
          "https://updates.product.local",
          "ws://100.*:*",
          "wss://100.*:*"
        ],
        "object-src": "'none'",
        "frame-ancestors": "'none'",
        "base-uri": "'none'",
        "form-action": "'none'"
      },
      "assetProtocol": {
        "enable": true,
        "scope": ["$APPDATA/**", "$APPLOCALDATA/**"]
      }
    }
  }
}
```

## TESTS

```bash
cd product
test -f apps/admin/src-tauri/tauri.conf.json || { echo "FAIL"; exit 1; }
grep -q "100.\\*:\\*" apps/admin/src-tauri/tauri.conf.json || { echo "FAIL: no tailnet CSP"; exit 1; }
grep -q "object-src" apps/admin/src-tauri/tauri.conf.json || { echo "FAIL: no object-src"; exit 1; }
echo "OK"
```
