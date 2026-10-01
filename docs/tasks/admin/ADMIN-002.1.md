# TASK ID: ADMIN-002.1
# TITLE: Configure tauri.conf.json product info
# STATUS: pending
# DEPENDENCIES: ADMIN-001.9
# ALLOWED FILES: product/apps/admin/src-tauri/tauri.conf.json
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Configure the Tauri product info — name, identifier, version, window defaults, bundle targets.

## REQUIRED IMPLEMENTATION

Replace `product/apps/admin/src-tauri/tauri.conf.json` with:

```json
{
  "$schema": "https://schema.tauri.app/config/2",
  "productName": "Product Admin",
  "version": "0.1.0",
  "identifier": "com.product.admin",
  "build": {
    "beforeDevCommand": "pnpm dev",
    "devUrl": "http://localhost:1420",
    "beforeBuildCommand": "pnpm build",
    "frontendDist": "../dist"
  },
  "app": {
    "windows": [
      {
        "title": "Product Admin",
        "width": 1280,
        "height": 800,
        "minWidth": 1024,
        "minHeight": 700,
        "resizable": true,
        "fullscreen": false,
        "center": true
      }
    ],
    "security": {
      "csp": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self' ipc: http://ipc.localhost; img-src 'self' data: blob: asset: http://asset.localhost; font-src 'self' data:"
    }
  },
  "bundle": {
    "active": true,
    "targets": ["msi", "deb", "appimage", "dmg"],
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/128x128@2x.png",
      "icons/icon.icns",
      "icons/icon.ico"
    ],
    "category": "Business",
    "copyright": "© 2026 Product",
    "shortDescription": "Professional desktop platform — Admin",
    "longDescription": "The Admin app for the Product platform. Manages projects, users, modules, and business data."
  }
}
```

## ACCEPTANCE CRITERIA
- [ ] File valid JSON
- [ ] identifier `com.product.admin`
- [ ] Windows defined with 1280x800 default
- [ ] Bundle targets include msi/deb/appimage/dmg

## TESTS

```bash
cd product
node -e "
const c = JSON.parse(require('fs').readFileSync('apps/admin/src-tauri/tauri.conf.json','utf8'));
if (c.identifier !== 'com.product.admin') process.exit(1);
if (c.app.windows[0].width !== 1280) process.exit(1);
const targets = c.bundle.targets;
if (!['msi','deb','appimage','dmg'].every(t => targets.includes(t))) process.exit(1);
console.log('OK');
"
```
