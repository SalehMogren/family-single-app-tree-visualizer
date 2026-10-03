import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { defineConfig, devices } from "@playwright/test";

// Every run starts from the seed data in a throwaway directory.
const dataDir = process.env.E2E_DATA_DIR ?? mkdtempSync(join(tmpdir(), "family-e2e-"));
process.env.E2E_DATA_DIR = dataDir;

const env = {
  DATA_DIR: dataDir,
  ADMIN_PASSWORD: "e2e-password",
  ADMIN_SECRET: "e2e-secret-e2e-secret-e2e-secret",
  NEXT_TELEMETRY_DISABLED: "1",
};

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    trace: "retain-on-failure",
    ...devices["Desktop Chrome"],
    ...(process.env.PLAYWRIGHT_CHROMIUM_PATH
      ? { launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } }
      : {}),
  },
  webServer: [
    {
      command: "pnpm --filter @family/web start",
      url: "http://localhost:3000",
      env,
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: "pnpm --filter @family/admin start",
      url: "http://localhost:3001/login",
      env,
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
});
