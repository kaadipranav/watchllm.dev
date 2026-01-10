import { test, expect } from '@playwright/test';

const DASHBOARD_ROUTES: Array<{ path: string; mustContain?: RegExp }> = [
  { path: '/dashboard', mustContain: /Dashboard/i },
  { path: '/dashboard/projects', mustContain: /Projects/i },
  { path: '/dashboard/api-keys', mustContain: /API Keys/i },
  { path: '/dashboard/usage', mustContain: /Usage/i },
  { path: '/dashboard/ab-testing', mustContain: /A\/B Testing|AB Testing/i },
  { path: '/dashboard/billing', mustContain: /Billing/i },
  { path: '/dashboard/settings', mustContain: /Settings/i },
  { path: '/dashboard/observability/logs', mustContain: /Requests|Logs/i },
  { path: '/dashboard/observability/analytics', mustContain: /Analytics/i },
  { path: '/dashboard/observability/traces', mustContain: /Traces/i },
  { path: '/dashboard/observability/agent-runs', mustContain: /Agent Debugger|Agent Runs/i },
];

test.describe('dashboard smoke', () => {
  test('authenticated session works', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByRole('main')).toBeVisible();
  });

  for (const route of DASHBOARD_ROUTES) {
    test(`loads ${route.path}`, async ({ page }) => {
      await page.goto(route.path);
      await expect(page.getByRole('main')).toBeVisible();
      if (route.mustContain) {
        await expect(page.getByRole('main')).toContainText(route.mustContain);
      }
    });
  }

  test('visiting /login redirects to dashboard when authed', async ({ page }) => {
    await page.goto('/login');
    await page.waitForURL('**/dashboard', { timeout: 30_000 });
    await expect(page.getByRole('main')).toBeVisible();
  });
});
