import { defineConfig } from "@playwright/test";
import path from "path";

const baseURL = process.env.E2E_BASE_URL || "http://localhost:3000";
const storageState = path.join(__dirname, ".playwright", ".auth", "user.json");

export default defineConfig({
  testDir: "tests/e2e",
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  timeout: 60_000,
  expect: {
    timeout: 15_000,
  },
  webServer: process.env.E2E_NO_WEBSERVER
    ? undefined
    : {
        command: "pnpm dev -- -p 3000",
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
  globalSetup: "./tests/e2e/global-setup",
  projects: [
    {
      name: "public",
      testMatch: /public\.spec\.ts/,
      use: {
        baseURL,
      },
    },
    {
      name: "authenticated",
      testIgnore: /public\.spec\.ts/,
      use: {
        baseURL,
        storageState,
      },
    },
  ],
});
