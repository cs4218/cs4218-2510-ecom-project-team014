import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import path from 'path';

const PRODUCT_DATA = {
    name: 'Tee',
    description: 'This is a Tee',
    price: '123',
    quantity: '10',
    shipping: 'Yes', // Yes
};


test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    // Login as admin
    await page.getByRole('link', { name: 'Login' }).click();
    await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('test@admin.com');
    await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('password');
    await page.getByRole('button', { name: 'LOGIN' }).click();
    await page.getByRole('button', { name: 'Test' }).click();
    await page.getByRole('link', { name: 'Dashboard' }).click();
    await page.getByRole('link', { name: 'Create Product' }).click();
});

test.describe('CreateProduct UI Tests', () => {

    test('should render all form fields', async ({ page }) => {
        await expect(page.locator('h1')).toContainText('Create Product');
        await expect(page.getByTestId('antd-select')).toBeVisible(); // category select
        await expect(page.getByTestId('shipping-select')).toBeVisible(); // shipping select
        await expect(page.getByPlaceholder('write a name')).toBeVisible();
        await expect(page.getByPlaceholder('write a description')).toBeVisible();
        await expect(page.getByPlaceholder('write a Price')).toBeVisible();
        await expect(page.getByPlaceholder('write a quantity')).toBeVisible();
        await expect(page.getByRole('button', { name: 'CREATE PRODUCT' })).toBeVisible();
    });


    test('should create a product safely', async ({ page }) => {
        try {
            // Select category
            const categorySelect = page.getByTestId('antd-select');
            await categorySelect.click();
            await page.locator('.ant-select-item').first().click();

            // Upload photo
            const filePath = path.resolve(__dirname, 'fixtures/product-test.jpg');
            await page.locator('input[type="file"]').setInputFiles(filePath);

            // Fill text fields safely
            await page.getByPlaceholder('write a name').fill(String(PRODUCT_DATA.name));
            await page.getByPlaceholder('write a description').fill(String(PRODUCT_DATA.description));
            await page.getByPlaceholder('write a Price').fill(String(PRODUCT_DATA.price));
            await page.getByPlaceholder('write a quantity').fill(String(PRODUCT_DATA.quantity));

            // Shipping select
            const shippingSelect = page.getByTestId('shipping-select');
            await shippingSelect.click();
            await page.locator('.ant-select-item').filter({ hasText: PRODUCT_DATA.shipping }).click();

            // Click CREATE PRODUCT
            await page.getByRole('button', { name: 'CREATE PRODUCT' }).click();

            // Confirm navigation
            await expect(page).toHaveURL(/\/dashboard\/admin\/products/);

            // Verify product appears correctly
            const productCard = page.locator('.product-link').filter({ hasText: String(PRODUCT_DATA.name) });
            await expect(productCard).toBeVisible();
            await expect(productCard.locator('img')).toBeVisible();
            await expect(productCard.locator('.card-title')).toHaveText(String(PRODUCT_DATA.name));
            await expect(productCard.locator('.card-text')).toHaveText(String(PRODUCT_DATA.description));
        } finally {
            await page.goto("http://localhost:3000/dashboard/admin/product/Tee");
            page.on("dialog", async (dialog) => {
                expect(dialog.type()).toBe("prompt");
                expect(dialog.message()).toContain("Are You Sure want to delete");
                await dialog.accept("yes");
            });

            await page.getByRole("button", { name: "DELETE PRODUCT" }).click();

            // Expect navigation back to product list
            await expect(page).toHaveURL(/\/dashboard\/admin\/products/);

            // Verify product no longer exists
            const deletedProduct = page.locator(".product-link").filter({ hasText: PRODUCT_DATA.name });
            await expect(deletedProduct).toHaveCount(0);
        }

    });


});



