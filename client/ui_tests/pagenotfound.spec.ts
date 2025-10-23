import { test, expect } from '@playwright/test';

test.describe('Pagenotfound UI Tests', () => {
  test('shows 404 page for unknown route', async ({ page }) => {
    await page.goto('http://localhost:3000/fakeroute', { waitUntil: 'domcontentloaded' });

    // core content
    await expect(page.locator('text=404')).toBeVisible();
    await expect(page.locator('text=Oops ! Page Not Found')).toBeVisible();

    const goBack = page.getByRole('link', { name: 'Go Back' });
    await expect(goBack).toBeVisible();
    await expect(goBack).toHaveAttribute('href', '/');

    // document title contains "page not found" (case-insensitive)
    await expect(page).toHaveTitle(/go back- page not found/i);

    // header and footer (Layout integration)
    await expect(page.locator('header, nav, [data-testid="header"]')).toBeVisible();
    await expect(page.locator('footer, .footer, [data-testid="footer"]')).toBeVisible();
  });

  test('clicking Go Back navigates to home', async ({ page }) => {
    await page.goto('http://localhost:3000/does-not-exist');
    await page.click('a:has-text("Go Back")');

    // allow SPA navigation to complete
    await page.waitForURL('http://localhost:3000/', { timeout: 7000 });
    await expect(page).toHaveURL('http://localhost:3000/');
  });
});