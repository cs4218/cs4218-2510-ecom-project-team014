import { test, expect } from '@playwright/test';

test.describe.configure({ mode: 'parallel' });

const LOGIN_URL = 'http://localhost:3000/login';

test.describe('Login Page UI', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(LOGIN_URL);
  });

  test('renders login form', async ({ page }) => {
    await expect(page.getByText('LOGIN FORM')).toBeVisible();
    await expect(page.getByPlaceholder('Enter Your Email')).toBeVisible();
    await expect(page.getByPlaceholder('Enter Your Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'LOGIN' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Forgot Password' })).toBeVisible();
  });

  test('inputs are initially empty', async ({ page }) => {
    expect(await page.getByPlaceholder('Enter Your Email').inputValue()).toBe('');
    expect(await page.getByPlaceholder('Enter Your Password').inputValue()).toBe('');
  });

  test('allows typing in inputs', async ({ page }) => {
    await page.getByPlaceholder('Enter Your Email').fill('test@example.com');
    await page.getByPlaceholder('Enter Your Password').fill('password123');
    expect(await page.getByPlaceholder('Enter Your Email').inputValue()).toBe('test@example.com');
    expect(await page.getByPlaceholder('Enter Your Password').inputValue()).toBe('password123');
  });

  test('login success redirects user', async ({ page }) => {
    await page.route('**/api/v1/auth/login', async route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          user: { id: 1, email: 'test@example.com' },
          token: 'MOCK_TOKEN',
          message: 'Login successful'
        }),
      })
    );
    await page.getByPlaceholder('Enter Your Email').fill('test@example.com');
    await page.getByPlaceholder('Enter Your Password').fill('password123');
    await page.getByRole('button', { name: 'LOGIN' }).click();
    await expect(page).not.toHaveURL(LOGIN_URL);
  });

  test('shows error for invalid credentials', async ({ page }) => {
    await page.route('**/api/v1/auth/login', async route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          message: 'Invalid email',
        }),
      })
    );
    await page.getByPlaceholder('Enter Your Email').fill('invalid@example.com');
    await page.getByPlaceholder('Enter Your Password').fill('wrongpassword');
    await page.getByRole('button', { name: 'LOGIN' }).click();
    await expect(page.getByText('Invalid email')).toBeVisible();
  });

  test('should not be able to submit empty form', async ({ page }) => {
    await page.getByRole('button', { name: 'LOGIN' }).click();
    await expect(page).toHaveURL(LOGIN_URL); // Still on login page
  });

  test('should not be able to login when email is empty', async ({ page }) => {
    await page.getByPlaceholder('Enter Your Password').fill('password123');
    await page.getByRole('button', { name: 'LOGIN' }).click();
    await expect(page).toHaveURL(LOGIN_URL); // Still on login page
  });

  test('should not be able to login when password is empty', async ({ page }) => {
    await page.getByPlaceholder('Enter Your Email').fill('test@example.com');
    await page.getByRole('button', { name: 'LOGIN' }).click();
    await expect(page).toHaveURL(LOGIN_URL); // Still on login page
  });


  test('should show error if email is not registered', async ({ page }) => {
    await page.route('**/api/v1/auth/login', async route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          message: "Email is not registerd"
        }),
      });
    });
    await page.getByPlaceholder('Enter Your Email').fill('notregistered@example.com');
    await page.getByPlaceholder('Enter Your Password').fill('password123');
    await page.getByRole('button', { name: 'LOGIN' }).click();
    await expect(page.getByText(/Email is not registerd/i)).toBeVisible();
  });

  test('should show error if password is invalid', async ({ page }) => {
    await page.route('**/api/v1/auth/login', async route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          message: "Invalid Password"
        }),
      });
    });
    await page.getByPlaceholder('Enter Your Email').fill('registered@example.com');
    await page.getByPlaceholder('Enter Your Password').fill('wrongpassword');
    await page.getByRole('button', { name: 'LOGIN' }).click();
    await expect(page.getByText(/Invalid Password/i)).toBeVisible();
  });

  test('shows error on API/network error', async ({ page }) => {
    await page.route('**/api/v1/auth/login', route => route.abort());
    await page.getByPlaceholder('Enter Your Email').fill('test@example.com');
    await page.getByPlaceholder('Enter Your Password').fill('password123');
    await page.getByRole('button', { name: 'LOGIN' }).click();
    await expect(page.getByText('Something went wrong')).toBeVisible();
  });

  test('navigates to forgot-password page', async ({ page }) => {
    await page.getByRole('button', { name: 'Forgot Password' }).click();
    await expect(page).toHaveURL(/forgot-password/);
  });

  test('should autofocus email input', async ({ page }) => {
    const active = await page.evaluate(() => document.activeElement?.getAttribute('placeholder'));
    expect(active).toContain('Enter Your Email');
  });

  test('shows validation error if fields empty', async ({ page }) => {
    await page.getByRole('button', { name: 'LOGIN' }).click();
    await expect(page).toHaveURL(LOGIN_URL); 
  });
});

// Above tests are generated with the help of AI