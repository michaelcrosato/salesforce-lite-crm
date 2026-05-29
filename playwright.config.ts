import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.PLAYWRIGHT_PORT ?? 3004);
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./e2e",
  timeout: process.env.CI ? 180_000 : 60_000,
  workers: 1,
  expect: {
    timeout: process.env.CI ? 30_000 : 10_000
  },
  use: {
    baseURL,
    trace: process.env.CI ? "retain-on-failure" : "on-first-retry"
  },
  webServer: {
    command: `npm run dev -- --port ${port}`,
    url: `${baseURL}/dashboard`,
    reuseExistingServer: false,
    timeout: 120_000
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    }
  ]
});
