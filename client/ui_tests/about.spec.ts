import { test, expect } from '@playwright/test';

test.describe('About UI Tests', () => {
  test('renders About page with correct title and content', async ({ page }) => {
    await page.goto('http://localhost:3000/about');

    // Check that Layout sets the correct document title
    await expect(page).toHaveTitle(/About us - Ecommerce app/i);

    // Check for main image and alt text
    const aboutImg = page.getByAltText('contactus');
    await expect(aboutImg).toBeVisible();
    await expect(aboutImg).toHaveAttribute('src', '/images/about.jpeg');

    // Check for main content text
    await expect(page.getByText(/Add text/i)).toBeVisible();

    // Check for layout structure
    expect(await page.locator('.row.contactus').count()).toBeGreaterThan(0);
    expect(await page.locator('.col-md-6').count()).toBeGreaterThan(0);
    expect(await page.locator('.col-md-4').count()).toBeGreaterThan(0);

    // Check that header and footer are present
    expect(
      await page.locator('header, nav, [data-testid="header"]').count()
    ).toBeGreaterThan(0);
    expect(
      await page.locator('footer, .footer, [data-testid="footer"]').count()
    ).toBeGreaterThan(0);
  });

  test('footer links are correct', async ({ page }) => {
    await page.goto('http://localhost:3000/about');
    await expect(page.getByRole('link', { name: 'About' })).toHaveAttribute('href', '/about');
    await expect(page.getByRole('link', { name: 'Contact' })).toHaveAttribute('href', '/contact');
    await expect(page.getByRole('link', { name: 'Privacy Policy' })).toHaveAttribute('href', '/policy');
  });
});

