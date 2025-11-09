import { test, expect } from '@playwright/test';

const PROTECTED_ROUTES = [
  'http://localhost:3000/dashboard',
  'http://localhost:3000/dashboard/user',
  'http://localhost:3000/dashboard/user/profile',
  'http://localhost:3000/dashboard/user/orders',
];

test.describe('Protected routes when unauthenticated -> Spinner then redirect', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/');
    await page.evaluate(() => localStorage.clear());
    await page.context().clearCookies();
  });

  test('shows countdown spinner then redirects to home for protected routes', async ({ page }) => {
    for (const route of PROTECTED_ROUTES) {
      await page.goto(route);

      var countdownLocator = page.locator('text=/redirecting to you in \\d+ second/i');
      await expect(countdownLocator).toBeVisible({ timeout: 4000 });
      await expect(countdownLocator).toContainText('redirecting to you in 3 second');
      await page.waitForTimeout(1000);
      countdownLocator = page.locator('text=/redirecting to you in \\d+ second/i');
      await expect(countdownLocator).toBeVisible({ timeout: 4000 });
      await expect(countdownLocator).toContainText('redirecting to you in 2 second');
      await page.waitForTimeout(1000);
      countdownLocator = page.locator('text=/redirecting to you in \\d+ second/i');
      await expect(countdownLocator).toBeVisible({ timeout: 4000 });
      await expect(countdownLocator).toContainText('redirecting to you in 1 second');

      // Wait for redirect to home page (give a small buffer beyond the 3s countdown)
      await page.waitForURL('http://localhost:3000/', { timeout: 10000 });
      expect(page.url()).toBe('http://localhost:3000/');

      await page.waitForTimeout(300);
    }
  });
});