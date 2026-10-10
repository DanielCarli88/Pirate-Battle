import { test, expect } from "@playwright/test";

test("navigates options and persists settings", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Play" })).toBeVisible();
  await page.getByRole("button", { name: "Options" }).click();
  await page.getByRole("slider", { name: "Game session time" }).fill("120");
  await page.getByRole("button", { name: "Save options" }).click();
  await page.reload();
  await page.getByRole("button", { name: "Options" }).click();
  await expect(page.getByRole("slider", { name: "Game session time" })).toHaveValue("120");
});

test("starts a game and exposes an accessible pause control", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Play" }).click();
  await expect(page.getByRole("img", { name: "Pirate battle arena" })).toBeVisible();
  await page.getByRole("button", { name: "Pause" }).click();
  await expect(page.getByRole("dialog", { name: "Game paused" })).toBeVisible();
});

test("offers touch controls on mobile and pauses when the page is hidden", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "Touch controls are covered by the mobile project.");
  await page.goto("/");
  await page.getByRole("button", { name: "Play" }).click();
  await expect(page.getByRole("button", { name: "Move forward" })).toBeVisible();
  await page.evaluate(() => document.dispatchEvent(new Event("visibilitychange")));
  await page.evaluate(() => Object.defineProperty(document, "hidden", { configurable: true, value: true }));
  await page.evaluate(() => document.dispatchEvent(new Event("visibilitychange")));
  await expect(page.getByRole("dialog", { name: "Game paused" })).toBeVisible();
});

test("shows network failure scenarios and paginated navigation controls", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Network scenario").selectOption("connection");
  await page.getByRole("button", { name: "Match history" }).click();
  await expect(page.getByRole("alert")).toBeVisible();
  await page.getByLabel("Network scenario").selectOption("success");
  await page.getByRole("button", { name: "Ranking" }).click();
  await expect(page.getByRole("button", { name: "Previous" })).toBeVisible();
});

test("matches the menu visual baseline", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveScreenshot("menu.png", { fullPage: true });
});
