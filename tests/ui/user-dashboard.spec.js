import { test, expect } from '@playwright/test';
import { getOrdersByUserEmail, connectToTestDB, closeDBConnection } from '../fixtures/dbHelper.js';

test.describe('User Dashboard and Profile Tests', () => {
  // helper
  const loginAsUser = async (page, email = 'hello@test.com', password = 'password') => {
    await page.goto('/login');
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button:has-text("LOGIN")');
    await page.waitForTimeout(1000);
  };

  test.beforeEach(async ({ page }) => {
    // need to be on an actual page before accessing localStorage (to avoid SecurityError)
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('should display user dashboard with user info', async ({ page }) => {
    await loginAsUser(page);

    await page.goto('/dashboard/user');

    await expect(page).toHaveTitle(/Dashboard/);

    await expect(page.locator('h3:has-text("Test 3")')).toBeVisible();
    await expect(page.locator('h3:has-text("hello@test.com")')).toBeVisible();
    await expect(page.locator('h3:has-text("hell3@test.com")')).toBeVisible(); // address
  });

  test('should display user menu with navigation links', async ({ page }) => {
    await loginAsUser(page);
    await page.goto('/dashboard/user');

    await expect(page.locator('h4:has-text("Dashboard")')).toBeVisible();

    const profileLink = page.locator('a.list-group-item:has-text("Profile")');
    await expect(profileLink).toBeVisible();
    await expect(profileLink).toHaveAttribute('href', '/dashboard/user/profile');

    const ordersLink = page.locator('a.list-group-item:has-text("Orders")');
    await expect(ordersLink).toBeVisible();
    await expect(ordersLink).toHaveAttribute('href', '/dashboard/user/orders');
  });

  test('should navigate to profile page from user menu', async ({ page }) => {
    await loginAsUser(page);
    await page.goto('/dashboard/user');

    // click profie
    await page.click('a.list-group-item:has-text("Profile")');

    // check nav to profile page
    await expect(page).toHaveURL(/\/dashboard\/user\/profile/);
    await expect(page.locator('h4:has-text("USER PROFILE")')).toBeVisible();
  });

  test('should navigate to orders page from user menu', async ({ page }) => {
    await loginAsUser(page);
    await page.goto('/dashboard/user');

    // click orders
    await page.click('a.list-group-item:has-text("Orders")');

    // check navigate to orders page
    await expect(page).toHaveURL(/\/dashboard\/user\/orders/);
    await expect(page.locator('h1:has-text("All Orders")')).toBeVisible();
  });

  test('should display profile form with pre-filled user data', async ({ page }) => {
    await loginAsUser(page);
    await page.goto('/dashboard/user/profile');

    // check form fields start with user's info
    const nameInput = page.locator('input[placeholder="Enter Your Name"]');
    await expect(nameInput).toHaveValue('Test 3');

    const emailInput = page.locator('input[placeholder="Enter Your Email "]');
    await expect(emailInput).toHaveValue('hello@test.com');
    // additionally email should be unmodifiable
    await expect(emailInput).toBeDisabled(); 

    const phoneInput = page.locator('input[placeholder="Enter Your Phone"]');
    await expect(phoneInput).toHaveValue('123');

    const addressInput = page.locator('input[placeholder="Enter Your Address"]');
    await expect(addressInput).toHaveValue('hell3@test.com');

    await expect(page.locator('button:has-text("UPDATE")')).toBeVisible();
  });

  test('should update user profile successfully', async ({ page }) => {
    await loginAsUser(page);
    await page.goto('/dashboard/user/profile');

    // update name, phone, address
    const nameInput = page.locator('input[placeholder="Enter Your Name"]');
    await nameInput.clear();
    await nameInput.fill('Test User Updated');

    const phoneInput = page.locator('input[placeholder="Enter Your Phone"]');
    await phoneInput.clear();
    await phoneInput.fill('999888777');

    const addressInput = page.locator('input[placeholder="Enter Your Address"]');
    await addressInput.clear();
    await addressInput.fill('123 Updated Address Street');

    // click update button
    await page.click('button:has-text("UPDATE")');

    await expect(page.locator('text=Profile Updated Successfully')).toBeVisible({ timeout: 5000 });

    await page.reload();

    // check new details
    await expect(nameInput).toHaveValue('Test User Updated');
    await expect(phoneInput).toHaveValue('999888777');
    await expect(addressInput).toHaveValue('123 Updated Address Street');

    // for extra precaution, go back to dashboard and check changes there
    await page.goto('/dashboard/user');
    await expect(page.locator('h3:has-text("Test User Updated")')).toBeVisible();
    await expect(page.locator('h3:has-text("123 Updated Address Street")')).toBeVisible();
  });

  test('should update password in profile', async ({ page }) => {
    await loginAsUser(page);
    await page.goto('/dashboard/user/profile');

    // update password
    const passwordInput = page.locator('input[placeholder="Enter Your Password"]');
    await passwordInput.fill('newpassword123');

    await page.click('button:has-text("UPDATE")');

    await expect(page.locator('text=Profile Updated Successfully')).toBeVisible({ timeout: 5000 });

    // Logout by clicking user dropdown then LOGOUT
    await page.click('text=Test 3'); // Click user name dropdown
    await page.waitForTimeout(300);
    await page.click('text=LOGOUT');
    await page.waitForTimeout(500);

    await page.goto('/login');
    await page.fill('input[type="email"]', 'hello@test.com');
    await page.fill('input[type="password"]', 'newpassword123');
    await page.click('button:has-text("LOGIN")');

    await page.waitForTimeout(1000);

    // we should be logged in properly
    // we can check this many ways, but /dashboard/user and the email is one of the easier ways
    await page.goto('/dashboard/user');
    await expect(page.locator('h3:has-text("hello@test.com")')).toBeVisible();
  });

  test('should display orders page with user menu both visible', async ({ page }) => {
    await loginAsUser(page);
    await page.goto('/dashboard/user/orders');

    // check orders page is shown (actual orders are covered in separate test)
    await expect(page.locator('h1:has-text("All Orders")')).toBeVisible();

    // check that dashboard nav links are still visible
    await expect(page.locator('h4:has-text("Dashboard")')).toBeVisible();
    await expect(page.locator('a:has-text("Profile")')).toBeVisible();
    await expect(page.locator('a:has-text("Orders")')).toBeVisible();
  });

  test('should display orders for user with existing orders', async ({ page }) => {
    const userEmail = 'cs4218@test.com';

    // get actual orders for this user
    await connectToTestDB()
    const ordersFromDB = await getOrdersByUserEmail(userEmail);

    expect(ordersFromDB.length).toBeGreaterThan(0);

    const firstOrder = ordersFromDB[0];
    const expectedProductCount = firstOrder.products.length;
    const expectedBuyerName = firstOrder.buyer.name;
    const expectedStatus = firstOrder.status;
    const expectedPaymentStatus = firstOrder.payment.success ? 'Success' : 'Failed';

    // go to orders page
    await loginAsUser(page, userEmail, 'password');
    await page.goto('/dashboard/user/orders');

    await page.waitForTimeout(2000);

    // check table exists
    const orderTable = page.locator('table').first();
    await expect(orderTable).toBeVisible();

    // check table headers
    await expect(page.locator('th:has-text("Status")')).toBeVisible();
    await expect(page.locator('th:has-text("Buyer")')).toBeVisible();
    await expect(page.locator('th:has-text("date")')).toBeVisible();
    await expect(page.locator('th:has-text("Payment")')).toBeVisible();
    await expect(page.locator('th:has-text("Quantity")')).toBeVisible();

    // check table data against order document from mongo
    await expect(page.locator(`td:has-text("${expectedBuyerName}")`)).toBeVisible();
    await expect(page.locator(`td:has-text("${expectedStatus}")`)).toBeVisible();
    await expect(page.locator(`td:has-text("${expectedPaymentStatus}")`)).toBeVisible();
    await expect(page.locator(`td:has-text("${expectedProductCount}")`)).toBeVisible();

    // check number of products to match against mongo document
    const productCards = page.locator('.row.card.flex-row');
    expect(await productCards.count()).toBe(expectedProductCount);
  });

  test('should redirect to homepage with countdown when accessing dashboard without login', async ({ page }) => {
    // visit dashboard without login
    await page.goto('/dashboard/user');

    // check for redirecting message
    await expect(page.locator('text=/redirecting.*in/i')).toBeVisible({ timeout: 2000 });

    // check countdown (we check for any one of the countdown timer texts, to avoid any event loop complications)
    const countdownVisible = await Promise.race([
      page.locator('text=3 second').isVisible().then(() => true),
      page.locator('text=2 second').isVisible().then(() => true),
      page.locator('text=1 second').isVisible().then(() => true),
      page.waitForTimeout(4000).then(() => false)
    ]);

    expect(countdownVisible).toBe(true);

    // check redirect to home
    await page.waitForURL('http://localhost:3000', { timeout: 5000 });

    // check we're on home page (note that there is not trailing slash in this URL)
    expect(page.url()).toBe('http://localhost:3000/');
  });
});
