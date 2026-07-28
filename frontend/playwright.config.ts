import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  globalSetup: "./tests/e2e/global-setup.ts",
  fullyParallel: false,
  workers: 1,
  retries: 1,
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report", open: "never" }],
    ["json", { outputFile: "test-results/results.json" }]
  ],
  // Generous: tests run against `next dev`, which JIT-compiles each route on
  // its first hit. A journey visiting 6+ distinct dashboard routes can pay
  // that compile cost repeatedly on a cold run — this is dev-server latency,
  // not app or test flakiness (a production build wouldn't have it).
  timeout: 90_000,
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure"
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] }
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] }
    }
  ],
  webServer: [
    {
      command: "npm run server:dev",
      url: "http://localhost:5000/health",
      reuseExistingServer: true,
      timeout: 60_000,
      cwd: "."
    },
    {
      command: "npm run dev",
      url: "http://localhost:3000",
      reuseExistingServer: true,
      timeout: 60_000,
      cwd: "."
    }
  ]
});
