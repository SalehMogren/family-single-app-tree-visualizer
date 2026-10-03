import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { include: ["test/**/*.test.ts"] },
  resolve: {
    alias: { "server-only": new URL("./test/server-only-stub.ts", import.meta.url).pathname },
  },
});
