import { test, expect } from '@playwright/test';

test.describe('public pages', () => {
  test('home page loads', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/WatchLLM/i);
  });

  test('login page is reachable', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
  });

  test('signup page is reachable', async ({ page }) => {
    await page.goto('/signup');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('docs index loads', async ({ page }) => {
    await page.goto('/docs');
    await expect(page.getByRole('main')).toBeVisible();
  });
});
