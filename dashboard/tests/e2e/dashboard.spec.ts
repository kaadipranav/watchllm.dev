import { test, expect } from "@playwright/test";

test.describe("dashboard flows", () => {
  test("can open dashboard shell", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByRole("main")).toBeVisible();
  });

  test("can view API key list", async ({ page }) => {
    await page.goto("/dashboard/api-keys");
    await expect(page.getByRole("main")).toBeVisible();
    await expect(page.getByRole("main")).toContainText(/API Keys/i);
  });
});
