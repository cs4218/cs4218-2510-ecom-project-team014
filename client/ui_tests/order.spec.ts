import { test, expect } from '@playwright/test';

test.describe('Orders UI Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login and navigate to orders page
    await page.goto('http://localhost:3000/login');
    await page.waitForSelector('input[type="password"]', { timeout: 15000 });
    await page.fill('input[type="password"]', 'password');
    await page.fill('input[placeholder="Enter Your Email"]', 'tester@nus.edu');
    await page.click('button:has-text("LOGIN")');
    await page.waitForURL('http://localhost:3000/');
    await page.goto('http://localhost:3000/dashboard/user/orders');
  });

  test('renders orders heading and user menu', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /All Orders/i })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Profile' })).toHaveAttribute('href', '/dashboard/user/profile');
    await expect(page.getByRole('link', { name: 'Orders' })).toHaveAttribute('href', '/dashboard/user/orders');
  });

  test('shows no orders message if there are no orders', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /All Orders/i })).toBeVisible();
    expect(await page.locator('.border.shadow').count()).toBe(0);
  });

  test('test for two orders', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('okok@okok.com');
    await page.getByRole('textbox', { name: 'Enter Your Email' }).press('Tab');
    await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('123455');
    await page.getByRole('button', { name: 'LOGIN' }).click();
    await page.getByRole('button', { name: 'qqq' }).click();
    await page.getByRole('link', { name: 'Dashboard' }).click();
    await page.getByRole('link', { name: 'Orders' }).click();
    await expect(page.getByRole('main')).toMatchAriaSnapshot(`
      - img "NUS T-shirt"
      - paragraph: NUS T-shirt
      - paragraph: Plain NUS T-shirt for sale
      - paragraph: "/Price : \\\\d+\\\\.\\\\d+/"
      `);
    await page.locator('div').filter({ hasText: /^SmartphoneA high-end smartphonePrice : 999\.99$/ }).first().click();
    await expect(page.locator('tbody')).toContainText('1');
    await expect(page.locator('tbody')).toContainText('Not Process');
    await expect(page.locator('tbody')).toContainText('qqq');
    await expect(page.locator('tbody')).toContainText('a few seconds ago');
    await expect(page.locator('tbody')).toContainText('Failed');
    await expect(page.locator('tbody')).toContainText('2');
  });

  test('user menu links navigate correctly', async ({ page }) => {
    await page.click('a:has-text("Profile")');
    await expect(page).toHaveURL('http://localhost:3000/dashboard/user/profile');
    await page.goBack();
    await page.click('a:has-text("Orders")');
    await expect(page).toHaveURL('http://localhost:3000/dashboard/user/orders');
  });

  test('layout header and footer are present', async ({ page }) => {
    await page.waitForURL('http://localhost:3000/dashboard/user/orders');
    expect(
      await page.locator('header, nav, [data-testid="header"]').count()
    ).toBeGreaterThan(0);
    expect(
      await page.locator('footer, .footer, [data-testid="footer"]').count()
    ).toBeGreaterThan(0);
  });
  
  
});