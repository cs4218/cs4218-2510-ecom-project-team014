import { test, expect } from '@playwright/test';

const LOGIN_URL = 'http://localhost:3000/login';

// Use unique test user credentials keyed by run for cleanup or uniqueness
const validUser = {
  email: 'testuser@example.com', // change to unique for each run if possible
  password: 'password123',
};

test.describe('Login Page UI - Real E2E', () => {
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
    await page.getByPlaceholder('Enter Your Email').fill(validUser.email);
    await page.getByPlaceholder('Enter Your Password').fill(validUser.password);
    expect(await page.getByPlaceholder('Enter Your Email').inputValue()).toBe(validUser.email);
    expect(await page.getByPlaceholder('Enter Your Password').inputValue()).toBe(validUser.password);
  });

  test('shows error for invalid credentials', async ({ page }) => {
    await page.getByPlaceholder('Enter Your Email').fill('invalid@example.com');
    await page.getByPlaceholder('Enter Your Password').fill('wrongpassword');
    await page.getByRole('button', { name: 'LOGIN' }).click();

    await expect(page).toHaveURL(LOGIN_URL); // Stays on login page on failure
  });

  test('should not be able to submit empty form', async ({ page }) => {
    await page.getByRole('button', { name: 'LOGIN' }).click();
    await expect(page).toHaveURL(LOGIN_URL);
  });

  test('should not be able to login when email is empty', async ({ page }) => {
    await page.getByPlaceholder('Enter Your Password').fill('password123');
    await page.getByRole('button', { name: 'LOGIN' }).click();
    await expect(page).toHaveURL(LOGIN_URL);
  });

  test('should not be able to login when password is empty', async ({ page }) => {
    await page.getByPlaceholder('Enter Your Email').fill(validUser.email);
    await page.getByRole('button', { name: 'LOGIN' }).click();
    await expect(page).toHaveURL(LOGIN_URL);
  });

  test('should not be able to login if email is not registered', async ({ page }) => {
    await page.getByPlaceholder('Enter Your Email').fill('notregistered@example.com');
    await page.getByPlaceholder('Enter Your Password').fill('password123');
    await page.getByRole('button', { name: 'LOGIN' }).click();
    await expect(page).toHaveURL(LOGIN_URL);
  });

  test('should not be able to login if password is invalid', async ({ page }) => {
    await page.getByPlaceholder('Enter Your Email').fill(validUser.email);
    await page.getByPlaceholder('Enter Your Password').fill('wrongpassword');
    await page.getByRole('button', { name: 'LOGIN' }).click();
    await expect(page).toHaveURL(LOGIN_URL);
  });

  test('navigates to forgot-password page', async ({ page }) => {
    await page.getByRole('button', { name: 'Forgot Password' }).click();
    await expect(page).toHaveURL(/forgot-password/);
  });

  test('register then login successfully', async ({ page, request }) => {
    const uniqueEmail = `user@example.com`;
    const password = 'testPassword123';

    // Register first
    await page.goto('http://localhost:3000/register');
    await page.getByPlaceholder('Enter Your Name').fill('Test User');
    await page.getByPlaceholder('Enter Your Email').fill(uniqueEmail);
    await page.getByPlaceholder('Enter Your Password').fill(password);
    await page.getByPlaceholder('Enter Your Phone').fill('0123456789');
    await page.getByPlaceholder('Enter Your Address').fill('Test Address');
    await page.locator('input[type="date"]').fill('2000-01-01');
    await page.getByPlaceholder('What is Your Favorite sports').fill('Football');
    await page.getByRole('button', { name: 'REGISTER' }).click();

    // Wait for redirect to login page after registration
    await page.waitForURL('http://localhost:3000/login');

    // Then login with the registered user
    await page.getByPlaceholder('Enter Your Email').fill(uniqueEmail);
    await page.getByPlaceholder('Enter Your Password').fill(password);
    await page.getByRole('button', { name: 'LOGIN' }).click();

    // Wait for successful login (e.g., redirect off login page)
    await expect(page).not.toHaveURL('http://localhost:3000/login');

    const deleteResponse = await request.delete(`http://localhost:3000/api/v1/test/delete-user/${encodeURIComponent(uniqueEmail)}`);
    expect(deleteResponse.ok()).toBe(true);
  });

});

// Above tests are generated with the help of AI