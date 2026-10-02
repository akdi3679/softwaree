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
