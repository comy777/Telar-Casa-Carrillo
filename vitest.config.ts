import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@telar/ui": fileURLToPath(new URL("./packages/ui/src/index.ts", import.meta.url)),
      "@telar/api-client": fileURLToPath(new URL("./packages/api-client/src/index.ts", import.meta.url)),
      "@": fileURLToPath(new URL("./apps/storefront/src", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    include: ["packages/**/*.test.{ts,tsx}", "apps/**/*.test.{ts,tsx}"],
    setupFiles: ["./vitest.setup.ts"],
  },
});
