import { test, expect } from "@playwright/test";
import path from "path";

const PRODUCT_DATA = {
    name: 'Tee',
    description: 'This is a Tee',
    price: '123',
    quantity: '10',
    shipping: 'Yes', // Yes
};

const UPDATED_PRODUCT = {
    name: "Updated Tee",
    description: "This is an updated Tee",
    price: "150",
    quantity: "20",
    shipping: "1", // Yes
};

test.beforeEach(async ({ page }) => {
    // Go to login page
    await page.goto("http://localhost:3000/login");

    // Login as admin
    await page.getByRole("textbox", { name: "Enter Your Email" }).fill("test@admin.com");
    await page.getByRole("textbox", { name: "Enter Your Password" }).fill("password");
    await page.getByRole("button", { name: "LOGIN" }).click();
    await page.getByRole('button', { name: 'Test' }).click();
    await page.getByRole('link', { name: 'Dashboard' }).click();
    await page.getByRole('link', { name: 'Create Product' }).click();

    //create product for test
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

    // Navigate to Update Product page for "Tee"
    await page.goto("http://localhost:3000/dashboard/admin/product/Tee");
});




test.describe("UpdateProduct UI Tests", () => {
    test("should render all fields and buttons", async ({ page }) => {
        try {
            await expect(page.locator("h1")).toContainText("Update Product");
            await expect(page.getByTestId("category-select")).toBeVisible();
            await expect(page.getByTestId("shipping-select")).toBeVisible();
            await expect(page.getByPlaceholder("write a name")).toBeVisible();
            await expect(page.getByPlaceholder("write a description")).toBeVisible();
            await expect(page.getByPlaceholder("write a Price")).toBeVisible();
            await expect(page.getByPlaceholder("write a quantity")).toBeVisible();
            await expect(page.getByRole("button", { name: "UPDATE PRODUCT" })).toBeVisible();
            await expect(page.getByRole("button", { name: "DELETE PRODUCT" })).toBeVisible();
        }
        finally {
            page.on("dialog", async (dialog) => {
                expect(dialog.type()).toBe("prompt");
                expect(dialog.message()).toContain("Are You Sure want to delete");
                await dialog.accept("yes");
            });

            await page.getByRole("button", { name: "DELETE PRODUCT" }).click();

            // Expect navigation back to product list
            await expect(page).toHaveURL(/\/dashboard\/admin\/products/);

            // Verify product no longer exists
            const deletedProduct = page.locator(".product-link").filter({ hasText: UPDATED_PRODUCT.name });
            await expect(deletedProduct).toHaveCount(0);
        }

    });

    test("should update product successfully", async ({ page }) => {
        try {
            // Fill in updated data
            await page.getByPlaceholder("write a name").fill(UPDATED_PRODUCT.name);
            await page.getByPlaceholder("write a description").fill(UPDATED_PRODUCT.description);
            await page.getByPlaceholder("write a Price").fill(UPDATED_PRODUCT.price);
            await page.getByPlaceholder("write a quantity").fill(UPDATED_PRODUCT.quantity);

            // Select category (first option)
            await page.getByTestId("category-select").click();
            await page.locator(".ant-select-item").first().click();

            // Select shipping
            await page.getByTestId("shipping-select").click();
            await page.locator(".ant-select-item").filter({ hasText: "Yes" }).click();

            // Upload a new photo
            const filePath = path.resolve(__dirname, "fixtures/product-update.jpg");
            const inputFile = page.locator('input[type="file"]');
            await inputFile.setInputFiles(filePath);

            // Click update
            await page.getByRole("button", { name: "UPDATE PRODUCT" }).click();

            // Expect navigation to product list page
            await expect(page).toHaveURL(/\/dashboard\/admin\/products/);

            // Verify updated product is listed
            const productCard = page.locator(".product-link").filter({ hasText: PRODUCT_DATA.name});
            await expect(productCard).toBeVisible();
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

    test("should delete product successfully", async ({ page }) => {
        // Intercept window.prompt
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
    });
});
