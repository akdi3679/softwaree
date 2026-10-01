# TASK ID: USER-001.1
# TITLE: Init User Tauri app
# STATUS: pending
# DEPENDENCIES: ADMIN-011.5
# ALLOWED FILES: product/apps/user/package.json, product/apps/user/tsconfig.json, product/apps/user/vite.config.ts, product/apps/user/index.html
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Initialize the User Tauri app (read-only projection consumer).

## REQUIRED IMPLEMENTATION

Create `product/apps/user/package.json`:

```json
{
  "name": "@product/user",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tauri build",
    "preview": "vite preview",
    "tauri": "tauri",
    "lint": "biome check .",
    "test": "vitest",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@product/contracts": "workspace:*",
    "@tanstack/react-query": "^5.50.0",
    "@tanstack/react-router": "^1.50.0",
    "@tauri-apps/api": "^2.0.0",
    "@tauri-apps/plugin-dialog": "^2.0.0",
    "@tauri-apps/plugin-fs": "^2.0.0",
    "@tauri-apps/plugin-http": "^2.0.0",
    "@tauri-apps/plugin-log": "^2.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@tauri-apps/cli": "^2.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.3.0",
    "typescript": "^5.6.0",
    "vite": "^5.4.0"
  }
}
```

Create `product/apps/user/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noEmit": true,
    "isolatedModules": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  },
  "include": ["src"]
}
```

Create `product/apps/user/vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  build: { target: 'es2022' },
  server: { port: 1421, strictPort: true },
});
```

Create `product/apps/user/index.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Product User</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

## TESTS

```bash
cd product
test -f apps/user/package.json || { echo "FAIL"; exit 1; }
grep -q "@product/user" apps/user/package.json || { echo "FAIL"; exit 1; }
pnpm --filter user install > /dev/null 2>&1 || { echo "FAIL: install"; exit 1; }
echo "OK"
```
