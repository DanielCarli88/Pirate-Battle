import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests", fullyParallel: true, reporter: [["html", { outputFolder: "playwright-report" }], ["list"]],
  use: { baseURL: "http://127.0.0.1:4173", trace: "retain-on-failure", screenshot: "only-on-failure" },
  webServer: { command: "npm.cmd run dev -- --host 127.0.0.1", url: "http://127.0.0.1:4173", reuseExistingServer: true },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }, { name: "mobile", use: { ...devices["Pixel 5"] } }]
});
