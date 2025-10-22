import { test, expect, Page } from '@playwright/test';

async function login(page: Page, email: string, password: string) {
  await page.goto('http://localhost:3000/login');
  //clear session/local state first
  await page.context().clearCookies();
  await page.evaluate(() => localStorage.clear());
  await page.getByPlaceholder('Enter Your Email').fill(email);
  await page.getByPlaceholder('Enter Your Password').fill(password);
  await page.getByRole('button', { name: 'LOGIN' }).click();
  // wait until not on login page
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });
}

test.describe('Header UI Tests', () => {
  test.beforeEach(async ({ page }) => {
    //refresh login/user session each time
    await page.goto('http://localhost:3000');
    await page.context().clearCookies();
    await page.evaluate(() => localStorage.clear());
  });

  test('guest user view testing', async ({ page }) => {
    await page.goto('http://localhost:3000');
    //make sure correct header buttons (specifically register/login for guests)
    await expect(page.getByRole('link', { name: 'Home' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Categories' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Register' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Login' })).toBeVisible();
    //cart exists and can be navigated to
    const cartLink = page.getByRole('link', { name: 'Cart' });
    await expect(cartLink).toBeVisible();
    await cartLink.click();
    await page.waitForURL('**/cart', { timeout: 5000 });
    expect(page.url()).toContain('/cart');
  });

  test('categories has all the correct categories and navigates', async ({ page }) => {
    await page.goto('http://localhost:3000');
    //open categories dropdown, verify correct categories
    const categories = page.getByRole('link', { name: 'Categories' });
    await categories.click();
    const allCat = page.getByRole('link', { name: 'ALL CATEGORIES' });
    await expect(allCat).toBeVisible();
    await expect(page.getByRole('link', { name: 'ELECTRONICS'})).toBeVisible();
    await expect(page.getByRole('link', { name: 'BOOK'})).toBeVisible();
    await expect(page.getByRole('link', { name: 'CLOTHING'})).toBeVisible();
    //check navigation works
    await allCat.click();
    await page.waitForURL('**/categories', { timeout: 5000 });
    expect(page.url()).toContain('/categories');
  });

  test('search input and button visible in header', async ({ page }) => {
    await page.goto('http://localhost:3000');
    const search = page.getByRole('searchbox', { name: 'Search'});
    await expect(search).toBeVisible();
    await expect(page.getByRole('button', { name: 'Search'})).toBeVisible();
  });

  test('logged in, ensure dashboard now shows correctly', async ({ page }) => {
    await login(page, 'tester@nus.edu', 'password');
    //check for correct options for logged in users
    await expect(page.getByRole('link', { name: 'Home' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Categories' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Cart' })).toBeVisible();

    //dashboard should now be visible, ensure navigates correctly
    await page.getByRole('button', { name: 'Daniel' }).click();
    const dashboard = page.getByRole('link', { name: 'Dashboard' });
    await expect(dashboard).toBeVisible();
    await dashboard.click();
    await page.waitForURL('**/dashboard/user', { timeout: 5000 });
    expect(page.url()).toContain('/dashboard/user');
  });


  /*Admin login
    name: Test
    email: tester@admin.com
    password: password
  */
  test('admin view: dashboard link should point to admin dashboard', async ({ page }) => {
    await login(page, 'tester@admin.com', 'password');
    await page.getByRole('button', { name: 'Test' }).click();
    const dashboard = page.getByRole('link', { name: 'Dashboard' });
    await expect(dashboard).toBeVisible();

    //make sure link has dashboard (admin a little different so don't match exactly)
    const href = await dashboard.getAttribute('href');
    expect(href).toBeTruthy();
    expect(href!.toLowerCase()).toContain('dashboard');
  });

  test('links in header navigate correctly', async ({ page }) => {
    const navLinks = [
      { text: 'Home', path: '/' },
      { text: 'About', path: '/about' },
      { text: 'Contact', path: '/contact' },
      { text: 'Privacy Policy', path: '/policy' },
    ];

    for (const nav of navLinks) {
      await page.goto('http://localhost:3000');
      const link = page.getByRole('link', { name: nav.text });
      await expect(link).toBeVisible();
      await link.click();
      await page.waitForURL(`**${nav.path}`, { timeout: 5000 });
      expect(page.url()).toContain(nav.path);
    }
  });
});