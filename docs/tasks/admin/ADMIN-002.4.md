# TASK ID: ADMIN-002.4
# TITLE: Add Vite config for Tauri
# STATUS: pending
# DEPENDENCIES: ADMIN-002.3
# ALLOWED FILES: product/apps/admin/vite.config.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Configure Vite to work properly with Tauri (fixed port, HMR, env handling).

## REQUIRED IMPLEMENTATION

Replace `product/apps/admin/vite.config.ts` with:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

const host = process.env.TAURI_DEV_HOST;

export default defineConfig({
  plugins: [react()],

  // Tauri expects a fixed port
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: 'ws',
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      ignored: ['**/src-tauri/**'],
    },
  },

  // Use relative paths for Tauri
  base: './',

  // Path resolution for @product/* workspace packages
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@product/contracts': path.resolve(__dirname, '../../packages/contracts/src/index.ts'),
      '@product/cloud-client': path.resolve(__dirname, '../../packages/cloud-client/src/index.ts'),
    },
  },

  // Build output
  build: {
    target: 'es2022',
    minify: process.env.TAURI_DEBUG ? false : 'esbuild',
    sourcemap: !!process.env.TAURI_DEBUG,
  },

  // Env prefix
  envPrefix: ['VITE_', 'TAURI_'],
});
```

## TESTS

```bash
cd product
test -f apps/admin/vite.config.ts || { echo "FAIL"; exit 1; }
grep -q "1420" apps/admin/vite.config.ts || { echo "FAIL: wrong port"; exit 1; }
grep -q "@product/contracts" apps/admin/vite.config.ts || { echo "FAIL: no alias"; exit 1; }
pnpm --filter admin typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
