import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

//test.describe.configure({ mode: 'parallel' });
test.beforeEach(async ({ page }) => {

    await page.goto('http://localhost:3000/');
    await page.getByRole('link', { name: 'Login' }).click();
    await page.getByRole('textbox', { name: 'Enter Your Email' }).click();
    await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('test@admin.com');
    await page.getByRole('textbox', { name: 'Enter Your Password' }).click();
    await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('password');
    await page.getByRole('button', { name: 'LOGIN' }).click();
    await page.getByRole('button', { name: 'Test' }).click();
    await page.getByRole('link', { name: 'Dashboard' }).click();
    await page.getByRole('link', { name: 'Create Category' }).click();
    await page.evaluate(() => localStorage.clear());
});

test.afterEach(async ({ page }) => {
    const allCategories = ['Notebook', 'Notebooks', 'Shoe', 'Bag']; // include edited names
    await page.evaluate(() => localStorage.clear());
    for (const category of allCategories) {
        // Check if the category exists first
        const row = page.locator('table tr').filter({ hasText: category });
        if (await row.count() > 0) {
            const deleteButton = row.getByRole('button', { name: 'Delete' });
            await expect(deleteButton).toBeVisible({ timeout: 5000 });
            await deleteButton.click();
            // Wait until the row disappears
            await expect(row).toHaveCount(0, { timeout: 10000 });
        }
    }

});


const CATEGORIES_ITEMS = [
    'Notebook',
    'Shoe',
    'Bag'
];


test.describe('Functions', () => {

    test('UI components', async ({ page }) => {

        await page.getByRole('textbox', { name: 'Enter new category' }).click();
        await page.getByRole('columnheader', { name: 'Name' }).click();
        await page.getByRole('columnheader', { name: 'Actions' }).click();
        await page.getByRole('button', { name: 'Submit' }).click();
        await expect(page.locator('h1')).toContainText('Manage Category');

    });

    test('should create default categories', async ({ page }) => {
        // Create categories
        await createDefaultCategories(page);
        // Verify categories are displayed
        await checkCategoriesInTable(page, CATEGORIES_ITEMS);
    });
    test('should allow editing a category', async ({ page }) => {
        await createDefaultCategories(page);
        await editCategory(page, 'Notebook', 'Notebooks');
        await checkCategoriesInTable(page, ['Notebooks', 'Shoe', 'Bag']);
    });

    test('should allow deleting a category', async ({ page }) => {
        await createDefaultCategories(page);
        await deleteCategory(page, 'Shoe');
        await checkCategoriesInTable(page, ['Notebook', 'Bag']);
    });

    test('should show the modal when editing', async ({ page }) => {
        await createDefaultCategories(page);
        const row = page.locator('td', { hasText: 'Bag' }).locator('..');
        await row.getByRole('button', { name: 'Edit' }).click();

        const modal = page.locator('.ant-modal');
        await expect(modal).toBeVisible();
        await expect(modal.getByTestId('update-input')).toHaveValue('Bag');

        const closeBtn = modal.locator('button').first(); // usually the X button
        await closeBtn.click();


    });






});




async function createDefaultCategories(page: Page) {
    // locate the input and submit button using data-testid
    const input = page.getByTestId('create-input');
    const submitButton = page.getByTestId('create-submit');

    for (const category of CATEGORIES_ITEMS) {
        await input.fill(category);
        await submitButton.click(); // submit the form
    }
}

export async function checkCategoriesInTable(page: Page, expectedCategories: string[]) {
    await page.waitForFunction(() => !!document.querySelector('table'));

    for (const cat of expectedCategories) {
        await page.waitForFunction(
            (categoryName) => {
                const table = document.querySelector('table');
                if (!table) return false;
                return Array.from(table.querySelectorAll('td')).some(td => td.textContent === categoryName);
            },
            cat,
            { timeout: 50000 }
        );
    }
}

async function editCategory(page: Page, oldName: string, newName: string) {
    const row = page.locator('td', { hasText: oldName }).locator('..'); // parent tr
    await row.getByRole('button', { name: 'Edit' }).click();
    const input = page.getByTestId('update-input');
    const submitBtn = page.getByTestId('update-submit');
    await input.fill(newName);
    await submitBtn.click();
}


async function deleteCategory(page: Page, name: string) {
    // Wait for the table to render
    await page.waitForFunction(() => !!document.querySelector('table'));

    // Find the row containing the category
    const row = page.locator('table tr').filter({ hasText: name });
    await expect(row).toBeVisible({ timeout: 5000 });

    // Find the Delete button inside that row and click it
    const deleteButton = row.getByRole('button', { name: 'Delete' });
    await expect(deleteButton).toBeVisible({ timeout: 50000 });
    await deleteButton.click();
}


