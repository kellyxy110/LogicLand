import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

// Unit tests target the pure engines/services (no DOM needed), so the default
// node environment is enough. The "@/" alias mirrors tsconfig paths.
export default defineConfig({
  resolve: {
    alias: { "@": resolve(__dirname, "./src") },
  },
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
});
