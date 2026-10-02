import { defineConfig, devices } from "@playwright/test";

// End-to-end journeys against the real stack: the API on a seeded Postgres, and the production
// build of the web app (docs/decisions/0013-hardening.md). Locally, a running API is reused.

const CI = process.env.CI !== undefined;
const API_PORT = 3000;
const WEB_PORT = 4173;

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 1 : 0,
  reporter: CI ? [["list"], ["github"]] : "list",
  use: {
    baseURL: `http://localhost:${String(WEB_PORT)}`,
    trace: "retain-on-failure",
    // The title screen is switched off, as a returning visitor might; its own tests turn it on.
    storageState: "./storage.json",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] }, grep: /@mobile/ },
  ],
  webServer: [
    {
      command: "node ../api/src/server.ts",
      url: `http://localhost:${String(API_PORT)}/health`,
      reuseExistingServer: !CI,
      env: { PORT: String(API_PORT), LOG_LEVEL: "warn" },
    },
    {
      // The production build, as it is deployed (`pnpm e2e` builds it first).
      command: `pnpm --filter @ffvii/web exec vite preview --port ${String(WEB_PORT)} --strictPort`,
      url: `http://localhost:${String(WEB_PORT)}`,
      reuseExistingServer: !CI,
    },
  ],
});
