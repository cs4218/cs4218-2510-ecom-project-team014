import { test, expect } from '@playwright/test';

/* Default Profile
   Name: Daniel Zhang
   email: tester@nus.edu
   password: password
   Phone: 99991111
   Address: Kent Ridge
   Answer: TT
*/

test.describe('Profile UI Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    await page.waitForSelector('input[type="password"]', { timeout: 15000 });
    await page.fill('input[type="password"]', 'password');
    await page.fill('input[placeholder="Enter Your Email"]', 'tester@nus.edu');
    await page.click('button:has-text("LOGIN")');
    await page.waitForURL('http://localhost:3000/');
    await page.goto('http://localhost:3000/dashboard/user/profile');
  });

  test('renders all profile form fields and user menu', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /USER PROFILE/i })).toBeVisible();
    await expect(page.getByPlaceholder('Enter Your Name')).toBeVisible();
    await expect(page.getByPlaceholder('Enter Your Email')).toBeVisible();
    await expect(page.getByPlaceholder('Enter Your Password')).toBeVisible();
    await expect(page.getByPlaceholder('Enter Your Phone')).toBeVisible();
    await expect(page.getByPlaceholder('Enter Your Address')).toBeVisible();
    await expect(page.getByRole('button', { name: /UPDATE/i })).toBeVisible();

    //Email field should be disabled 
    const emailInput = page.getByPlaceholder('Enter Your Email');
    await expect(emailInput).toBeDisabled();

    await expect(page.getByRole('link', { name: 'Profile' })).toHaveAttribute('href', '/dashboard/user/profile');
    await expect(page.getByRole('link', { name: 'Orders' })).toHaveAttribute('href', '/dashboard/user/orders');
  });

  test('can edit all fields expect email and submit', async ({ page }) => {
    await page.getByPlaceholder('Enter Your Name').fill('Jane Doe');
    await page.getByPlaceholder('Enter Your Password').fill('newpass');
    await page.getByPlaceholder('Enter Your Phone').fill('9876543210');
    await page.getByPlaceholder('Enter Your Address').fill('456 Elm St');
    await page.click('button:has-text("UPDATE")');
    await expect(page.getByText(/Profile Updated Successfully/i)).toBeVisible();

    // Change back to original so we don't mess up other tests
    await page.getByPlaceholder('Enter Your Name').fill('Daniel');
    await page.getByPlaceholder('Enter Your Password').fill('password');
    await page.getByPlaceholder('Enter Your Phone').fill('99991111');
    await page.getByPlaceholder('Enter Your Address').fill('kent ridge');
    await page.click('button:has-text("UPDATE")');
    await expect(page.getByText(/Profile Updated Successfully/i)).toBeVisible();

  });

  test('try to give bad password', async ({ page }) => {
    await page.getByPlaceholder('Enter Your Password').fill('qq');
    await page.click('button:has-text("UPDATE")');
    await expect(page.getByText(/Passsword is required and 6 character long/i)).toBeVisible();
  })

  test('shows error toast if network fails', async ({ page }) => {
    await page.route('*/**/api/v1/auth/profile', route => route.abort());
    await page.click('button:has-text("UPDATE")');
    await expect(page.getByText(/Something went wrong/i)).toBeVisible();
  });

  test('user menu links navigate correctly', async ({ page }) => {
    await page.click('a:has-text("Orders")');
    await expect(page).toHaveURL('http://localhost:3000/dashboard/user/orders');
    await page.goBack();
    await page.click('a:has-text("Profile")');
    await expect(page).toHaveURL('http://localhost:3000/dashboard/user/profile');
  });

  test('layout header and footer are present', async ({ page }) => {
    // Accept header as <header>, <nav>, or test-id
    expect(
      await page.locator('header, nav, [data-testid="header"]').count()
    ).toBeGreaterThan(0);
    expect(
      await page.locator('footer, .footer, [data-testid="footer"]').count()
    ).toBeGreaterThan(0);
  });
});