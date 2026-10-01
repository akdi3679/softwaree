# TASK ID: ADMIN-059.1
# TITLE: Add Admin: 2-second hot reload for dev mode
# STATUS: pending
# DEPENDENCIES: ADMIN-058.2
# ALLOWED FILES: product/apps/admin/src-tauri/tauri.conf.json, product/apps/admin/vite.config.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Save a file → see changes in 2 seconds.

## REQUIRED IMPLEMENTATION

Edit `product/apps/admin/vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 1420,
    strictPort: true,
    hmr: {
      port: 1421,
      clientPort: 1421,
      protocol: 'ws',
    },
    watch: {
      usePolling: false,
      interval: 100,
    },
  },
  build: {
    target: 'esnext',
    sourcemap: true,
  },
  clearScreen: false,
});
```

Edit `product/apps/admin/src-tauri/tauri.conf.json` (in the `dev` section):

```json
{
  "build": {
    "beforeDevCommand": "pnpm dev",
    "devUrl": "http://localhost:1420",
    "beforeBuildCommand": "pnpm build",
    "frontendDist": "../dist"
  }
}
```

## TESTS

```bash
cd product
grep -q "usePolling" apps/admin/vite.config.ts || { echo "FAIL"; exit 1; }
grep -q "devUrl" apps/admin/src-tauri/tauri.conf.json || { echo "FAIL"; exit 1; }
echo "OK"
```
