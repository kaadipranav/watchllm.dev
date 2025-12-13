import { test, expect } from "@playwright/test";

test.describe.skip("auth flows", () => {
  test("can view login page", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/WatchLLM/i);
  });

  test("can view signup page", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
});
