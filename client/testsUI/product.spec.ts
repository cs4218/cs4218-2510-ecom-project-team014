import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
    // ---- Login ----
    await page.goto('http://localhost:3000/');
    await page.getByRole('link', { name: 'Login' }).click();
    await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('test@admin.com');
    await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('password');
    await page.getByRole('button', { name: 'LOGIN' }).click();

    // ---- Navigate to Products Page ----
    await page.getByRole('button', { name: 'Test' }).click();
    await page.getByRole('link', { name: 'Dashboard' }).click();
    await page.getByRole('link', { name: 'Products' }).click(); // assume a link exists
});

test.describe('Products Page', () => {

    test('should display page title', async ({ page }) => {
        const title = page.locator('h1');
        await expect(title).toHaveText('All Products List');
    });

    test('should display all products', async ({ page }) => {
        await expect(page.locator('h1')).toContainText('All Products List');
        const productCards = page.locator('.product-link');

        // Check each product card has image, title, and description
        const firstCard = productCards.first();
        await expect(firstCard.locator('img')).toBeVisible();
        await expect(firstCard.locator('.card-title')).not.toBeEmpty();
        await expect(firstCard.locator('.card-text')).not.toBeEmpty();
    });

    test('should navigate to product detail when clicking a product', async ({ page }) => {
        const firstProductLink = page.locator('.product-link').first();
        const productName = await firstProductLink.locator('.card-title').textContent();

        await firstProductLink.click();

        // Wait for navigation
        await expect(page).toHaveURL(/\/dashboard\/admin\/product\//);
    });
});


