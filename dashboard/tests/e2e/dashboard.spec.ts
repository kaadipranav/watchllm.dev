import { test, expect } from "@playwright/test";

test.describe.skip("dashboard flows", () => {
  test("can open dashboard shell", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByRole("main")).toBeVisible();
  });

  test("can view API key list", async ({ page }) => {
    await page.goto("/dashboard/api-keys");
    await expect(page.getByText(/API Keys/i)).toBeVisible();
  });
});
