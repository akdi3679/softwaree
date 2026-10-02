import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@product/contracts": path.resolve(__dirname, "./packages/contracts/src/index.ts"),
      "@product/cloud-client": path.resolve(__dirname, "./packages/cloud-client/src/index.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["packages/**/*.test.ts", "apps/**/*.test.ts", "modules/**/*.test.ts"],
    exclude: ["node_modules", "dist", "build", "**/target/**"],
    passWithNoTests: true,
  },
});
