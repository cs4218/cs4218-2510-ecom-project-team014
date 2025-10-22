import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./ui-tests",
  timeout: 60_000,
  expect: { timeout: 5_000 },
  retries: process.env.CI ? 2 : 0,
  forbidOnly: !!process.env.CI,
  //   reporter: [["html", { open: "never" }], ["list"]],
  workers: process.env.CI ? 1 : undefined,
  reporter: [["html"], ["list"]],

  // Useful artifacts
  use: {
    baseURL: process.env.PW_BASE_URL || "http://localhost:5173", // adjust to your app
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 10_000,
  },

  // Start your frontend automatically (Vite example). Change command/port to match your app.
  //   webServer: {
  //     command: "npm run dev",
  //     url: "http://localhost:5173",
  //     reuseExistingServer: !process.env.CI,
  //     timeout: 120_000,
  //   },

  // Project only requires test on Chromium
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    // { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    // { name: "webkit", use: { ...devices["Desktop Safari"] } },
    // Example mobile viewport:
    // { name: 'Mobile Chrome', use: { ...devices['Pixel 7'] } },
  ],
});
