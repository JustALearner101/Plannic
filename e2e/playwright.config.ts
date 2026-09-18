import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./desktop",
  timeout: 45000,
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"], ["html", { outputFolder: "e2e/playwright-report", open: "never" }]],
  outputDir: ".tmp/playwright-test-results",
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 800 },
      },
    },
  ],
  webServer: {
    command: "bun run dev:web",
    port: 5173,
    reuseExistingServer: true,
    timeout: 30000,
  },
});
