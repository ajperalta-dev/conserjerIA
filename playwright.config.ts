import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "tests/e2e",
  use: {
    baseURL: "http://127.0.0.1:3485",
    channel: process.env.PLAYWRIGHT_CHANNEL || undefined,
  },
  webServer: {
    command: "npm run start -- --hostname 127.0.0.1 --port 3485",
    url: "http://127.0.0.1:3485",
    reuseExistingServer: false,
  },
});
