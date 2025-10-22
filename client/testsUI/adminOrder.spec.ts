import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
    // ---- Login ----
    await page.goto('http://localhost:3000/');
    await page.getByRole('link', { name: 'Login' }).click();
    await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('test@admin.com');
    await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('password');
    await page.getByRole('button', { name: 'LOGIN' }).click();

    // ---- Navigate to Orders Page ----
    await page.getByRole('button', { name: 'Test' }).click();
    await page.getByRole('link', { name: 'Dashboard' }).click();
    await page.getByRole('link', { name: 'Orders' }).click();

    await expect(page.locator('h1')).toHaveText('All Orders');
});

test.describe('Products Page', () => {

    test('should display page title', async ({ page }) => {
        const title = page.locator('h1');
        await expect(title).toHaveText('All Orders');
    });


});


test.describe('Function', () => {

    test('should display all orders with correct details', async ({ page }) => {
        const orders = page.locator('.border.shadow');

        // Expect at least one order
        await expect(await orders.count()).toBeGreaterThan(0);

        // Check table headers
        const headers = page.locator('table thead th');
        await expect(headers.nth(0)).toHaveText('#');
        await expect(headers.nth(1)).toHaveText('Status');
        await expect(headers.nth(2)).toHaveText('Buyer');
        await expect(headers.nth(3)).toHaveText('Date');
        await expect(headers.nth(4)).toHaveText('Payment');
        await expect(headers.nth(5)).toHaveText('Quantity');

        // Check first order details
        const firstOrder = orders.first();
        await expect(firstOrder.locator('td').nth(2)).not.toBeEmpty(); // Buyer name
        await expect(firstOrder.locator('td').nth(4)).toHaveText(/Success|Failed/); // Payment
        await expect(firstOrder.locator('td').nth(5)).toBeVisible(); // Quantity
    });

    test('should change order status', async ({ page }) => {
        const firstOrder = page.locator('.border.shadow').first();
        const select = firstOrder.locator('td').nth(1).locator('.ant-select-selector');

        // Open the select dropdown
        await select.click();

        // Choose a different status
        const newStatus = firstOrder.locator('.ant-select-item').filter({ hasText: 'Shipped' });
        await newStatus.click();

        // Wait a moment for the API request to complete
        await page.waitForTimeout(1000);

        // Verify select shows updated value
        await expect(select).toContainText('Shipped');
    });

    test('should display products inside each order', async ({ page }) => {
        const firstOrder = page.locator('.border.shadow').first();
        const products = firstOrder.locator('.card.flex-row');

        await expect(products.count()).toBeGreaterThan(0);

        const firstProduct = products.first();
        await expect(firstProduct.locator('img')).toBeVisible();
        await expect(firstProduct.locator('p').nth(0)).not.toBeEmpty(); // Product name
        await expect(firstProduct.locator('p').nth(2)).toContainText('Price :');
    });


});
