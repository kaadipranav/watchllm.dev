import { test, expect } from '@playwright/test';

test.describe('agent debugger', () => {
  test('fixtures load and show debug view', async ({ page }) => {
    await page.goto('/dashboard/observability/agent-runs');
    await expect(page.getByRole('main')).toBeVisible();

    // Normal fixture
    await page.getByRole('button', { name: /normal run/i }).click();
    await page.waitForURL('**/dashboard/observability/agent-runs/fixture/**', { timeout: 30_000 });
    await expect(page.getByText(/Total Run Cost/i)).toBeVisible();
    await expect(page.getByText(/Step Timeline/i)).toBeVisible();

    // Loop fixture
    await page.goto('/dashboard/observability/agent-runs');
    await page.getByRole('button', { name: /loop/i }).click();
    await page.waitForURL('**/dashboard/observability/agent-runs/fixture/**', { timeout: 30_000 });
    await expect(page.getByText(/Wasted Spend/i)).toBeVisible();

    // High cost fixture
    await page.goto('/dashboard/observability/agent-runs');
    await page.getByRole('button', { name: /high cost/i }).click();
    await page.waitForURL('**/dashboard/observability/agent-runs/fixture/**', { timeout: 30_000 });
    await expect(page.getByText(/Total Run Cost/i)).toBeVisible();
  });
});
