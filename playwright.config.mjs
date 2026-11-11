import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  retries: 0,
  use: {
    baseURL: "http://127.0.0.1:4173",
    channel: process.env.CI
      ? undefined
      : process.platform === "darwin"
        ? "chrome"
        : undefined,
    headless: true,
  },
  webServer: {
    command: "npm run dev",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: true,
  },
  reporter: "list",
});
