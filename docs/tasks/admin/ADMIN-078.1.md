# TASK ID: ADMIN-078.1
# TITLE: Add Admin: SPA fallback for deep links
# STATUS: pending
# DEPENDENCIES: CONTRACT-090.2
# ALLOWED FILES: product/apps/admin/src-tauri/tauri.conf.json
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Refresh on any route → no 404 from the webview.

## REQUIRED IMPLEMENTATION

Edit `product/apps/admin/src-tauri/tauri.conf.json` (build section):

```json
{
  "build": {
    "frontendDist": "../dist"
  },
  "app": {
    "windows": [
      {
        "label": "main",
        "title": "Product Admin",
        "width": 1280,
        "height": 800,
        "minWidth": 900,
        "minHeight": 600
      }
    ],
    "security": {
      "csp": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self' ipc: http://ipc.localhost"
    }
  }
}
```

Tauri 2 + Vite handle SPA fallback automatically when `historyApiFallback: true` (Vite default).

## TESTS

```bash
cd product
grep -q "minWidth" apps/admin/src-tauri/tauri.conf.json || { echo "FAIL"; exit 1; }
grep -q "csp" apps/admin/src-tauri/tauri.conf.json || { echo "FAIL"; exit 1; }
echo "OK"
```
