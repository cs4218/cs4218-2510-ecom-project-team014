import { test, expect } from '@playwright/test';

test.describe('Contact Us Page UI Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/contact');
  });

  test('should display page title correctly', async ({ page }) => {
    await expect(page).toHaveTitle(/Contact us/);
  });

  test('should display contact us heading', async ({ page }) => {
    const heading = page.locator('h1:has-text("CONTACT US")');
    await expect(heading).toBeVisible();
    await expect(heading).toHaveClass(/bg-dark/);
  });

  test('should display contact image', async ({ page }) => {
    // Check contact image is present and visible
    const image = page.locator('img[alt="contactus"]');
    await expect(image).toBeVisible();
    await expect(image).toHaveAttribute('src', '/images/contactus.jpeg');
  });

  test('should display description about 24x7 availability', async ({ page }) => {
    const description = page.locator('text=For any query or info about product, feel free to call anytime');
    await expect(description).toBeVisible();
    await expect(page.locator('text=24X7')).toBeVisible();
  });

  test('should display email contact information', async ({ page }) => {
    const emailText = page.locator('text=www.help@ecommerceapp.com');
    await expect(emailText).toBeVisible();
  });

  test('should display phone contact information', async ({ page }) => {
    const phoneText = page.locator('text=012-3456789');
    await expect(phoneText).toBeVisible();
  });

  test('should display toll-free support number', async ({ page }) => {
    const tollFreeText = page.locator('text=1800-0000-0000');
    await expect(tollFreeText).toBeVisible();
    await expect(page.locator('text=toll free')).toBeVisible();
  });

  test('should display all three contact icons', async ({ page }) => {
    const contactSection = page.locator('.col-md-4');
    const contactParagraphs = contactSection.locator('p.mt-3');

    await expect(contactParagraphs).toHaveCount(3);
  });

  test('should have proper layout structure', async ({ page }) => {
    const contactRow = page.locator('.row.contactus');
    await expect(contactRow).toBeVisible();

    // Check both columns exist
    const imageColumn = page.locator('.col-md-6');
    const infoColumn = page.locator('.col-md-4');

    await expect(imageColumn).toBeVisible();
    await expect(infoColumn).toBeVisible();
  });

  test('should display all contact information together', async ({ page }) => {
    await expect(page.locator('h1:has-text("CONTACT US")')).toBeVisible();
    await expect(page.locator('text=www.help@ecommerceapp.com')).toBeVisible();
    await expect(page.locator('text=012-3456789')).toBeVisible();
    await expect(page.locator('text=1800-0000-0000')).toBeVisible();
    await expect(page.locator('img[alt="contactus"]')).toBeVisible();
  });

  test('should have accessible image with alt text', async ({ page }) => {
    const image = page.locator('img[alt="contactus"]');
    await expect(image).toHaveAttribute('alt', 'contactus');
  });
});
