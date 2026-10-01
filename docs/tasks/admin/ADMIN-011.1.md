# TASK ID: ADMIN-011.1
# TITLE: Add Tauri build configuration
# STATUS: pending
# DEPENDENCIES: ADMIN-010.9
# ALLOWED FILES: product/apps/admin/src-tauri/tauri.conf.json, product/apps/admin/vite.config.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Finalize Tauri build config: target bundling, signing, update channel.

## REQUIRED IMPLEMENTATION

Update `product/apps/admin/src-tauri/tauri.conf.json` (replace `bundle` and `updater` sections):

```json
{
  "bundle": {
    "active": true,
    "targets": ["deb", "rpm", "appimage", "msi", "dmg", "app"],
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/128x128@2x.png",
      "icons/icon.icns",
      "icons/icon.ico"
    ],
    "category": "Productivity",
    "shortDescription": "Local-first project platform",
    "longDescription": "Self-hosted project platform with user sync, modules, and encrypted backups.",
    "resources": [],
    "externalBin": [],
    "copyright": "© 2026 Product Inc",
    "homepage": "https://product.local",
    "linux": {
      "deb": { "depends": [] },
      "appimage": { "bundleMediaFramework": false }
    },
    "macOS": {
      "minimumSystemVersion": "11.0",
      "hardenedRuntime": true,
      "entitlements": "entitlements.plist"
    },
    "windows": {
      "certificateThumbprint": null,
      "digestAlgorithm": "sha256",
      "timestampUrl": ""
    }
  },
  "updater": {
    "active": true,
    "dialog": true,
    "endpoints": [
      "https://updates.product.local/admin/{{target}}/{{arch}}/{{current_version}}"
    ],
    "pubkey": "REPLACE_WITH_PUBLIC_KEY",
    "windows": { "installMode": "passive" }
  }
}
```

Update `product/apps/admin/vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  build: {
    target: 'es2022',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'tanstack': ['@tanstack/react-router', '@tanstack/react-query'],
          'react': ['react', 'react-dom'],
        },
      },
    },
  },
  server: {
    port: 1420,
    strictPort: true,
  },
});
```

## TESTS

```bash
cd product
test -f apps/admin/src-tauri/tauri.conf.json || { echo "FAIL"; exit 1; }
grep -q "appimage" apps/admin/src-tauri/tauri.conf.json || { echo "FAIL: no appimage"; exit 1; }
grep -q "updater" apps/admin/src-tauri/tauri.conf.json || { echo "FAIL: no updater"; exit 1; }
pnpm --filter admin typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
