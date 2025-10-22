import { test, expect } from '@playwright/test';

const ADMIN_PAGE_URL = 'http://localhost:3000/dashboard/admin';
const LOGIN_URL = 'http://localhost:3000/login';

// Provide admin test user credentials from your test DB
const admin = {
  email: 'wongxucheng@gmail.com',
  password: 'abc021116'
};

test.describe('Admin Dashboard Page (E2E)', () => {
  test.beforeEach(async ({ page }) => {
    // Always login as admin (black box E2E)
    await page.goto(LOGIN_URL);
    await page.getByPlaceholder('Enter Your Email').fill(admin.email);
    await page.getByPlaceholder('Enter Your Password').fill(admin.password);
    await page.getByRole('button', { name: 'LOGIN' }).click();
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });

    // Now go to admin dashboard
    await page.goto(ADMIN_PAGE_URL);
  });

  test('should render the layout and admin info', async ({ page }) => {
    await expect(page.getByText(/Admin Panel/)).toBeVisible();
    await expect(page.getByText(/Admin Name/i)).toBeVisible();
    await expect(page.getByText(/Admin Email/i)).toBeVisible();
    await expect(page.getByText(/Admin Contact/i)).toBeVisible();
  });

  test('should show all admin menu links', async ({ page }) => {
    await expect(page.getByRole('link', { name: /Create Category/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Create Product/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Products/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Orders/i })).toBeVisible();
  });

  test('admin info card should have correct values', async ({ page }) => {
    // Generic black box check: The card contains values, not their exact implementation
    const name = await page.getByText(/Admin Name/i).textContent();
    const email = await page.getByText(/Admin Email/i).textContent();
    const phone = await page.getByText(/Admin Contact/i).textContent();
    expect(name).toContain('Admin Name');
    expect(email).toContain('Admin Email');
    expect(phone).toContain('Admin Contact');
  });

  test('Create Category link navigates correctly', async ({ page }) => {
    await page.getByRole('link', { name: /Create Category/i }).click();
    await expect(page).toHaveURL(/dashboard\/admin\/create-category/);
  });

  test('Create Product link navigates correctly', async ({ page }) => {
    await page.getByRole('link', { name: /Create Product/i }).click();
    await expect(page).toHaveURL(/dashboard\/admin\/create-product/);
  });

  test('Products link navigates correctly', async ({ page }) => {
    await page.getByRole('link', { name: /Products/i }).click();
    await expect(page).toHaveURL(/dashboard\/admin\/products/);
  });

  test('Orders link navigates correctly', async ({ page }) => {
    await page.getByRole('link', { name: /Orders/i }).click();
    await expect(page).toHaveURL(/dashboard\/admin\/orders/);
  });
});

// Above tests are generated with the help of AI
