import { test, expect } from '@playwright/test';

test.describe('Footer UI Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    await page.waitForSelector('input[type="password"]', { timeout: 15000 });
    await page.fill('input[type="password"]', 'password');
    await page.fill('input[placeholder="Enter Your Email"]', 'tester@nus.edu');
    await page.click('button:has-text("LOGIN")');
    await page.waitForURL('http://localhost:3000/');
  });

  test('renders footer text and links on home page', async ({ page }) => {
    await page.goto('http://localhost:3000/');

    // Footer main text
    await expect(page.getByText(/All Rights Reserved/i)).toBeVisible();

    // Footer links
    const aboutLink = page.getByRole('link', { name: 'About' });
    const contactLink = page.getByRole('link', { name: 'Contact' });
    const policyLink = page.getByRole('link', { name: 'Privacy Policy' });

    await expect(aboutLink).toHaveAttribute('href', '/about');
    await expect(contactLink).toHaveAttribute('href', '/contact');
    await expect(policyLink).toHaveAttribute('href', '/policy');
  });

  test('footer is present on other pages', async ({ page }) => {
    for (const route of ['http://localhost:3000/about', 'http://localhost:3000/contact', 'http://localhost:3000/policy', 'http://localhost:3000/dashboard/user/profile', 'http://localhost:3000/dashboard/user/orders']) {
      await page.goto(route);
      expect(await page.locator('footer, .footer, [data-testid="footer"]').count()).toBeGreaterThan(0);
      // Footer links
      const aboutLink = page.getByRole('link', { name: 'About' });
      const contactLink = page.getByRole('link', { name: 'Contact' });
      const policyLink = page.getByRole('link', { name: 'Privacy Policy' });

      await expect(aboutLink).toHaveAttribute('href', '/about');
      await expect(contactLink).toHaveAttribute('href', '/contact');
      await expect(policyLink).toHaveAttribute('href', '/policy');
    }
  });
});