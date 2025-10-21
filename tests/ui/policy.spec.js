import { test, expect } from '@playwright/test';

// we define policy sections and their corresponding keywords (instead of the full text) for some flexibility, while ensuring the required phrases are included.
// makes the test less brittle while ensuring proper specification adherence.
const policySections = [
  {
    title: 'Information Collection',
    keywords: ['personal information', 'name', 'email', 'payment', 'securely']
  },
  {
    title: 'Use of Information',
    keywords: ['process orders', 'deliver products', 'promotional emails', 'opt-out']
  },
  {
    title: 'Data Protection',
    keywords: ['security measures', 'secure servers', 'encryption']
  },
  {
    title: 'Cookies',
    keywords: ['cookies', 'shopping experience', 'browser settings', 'functionality']
  },
  {
    title: 'Third-Party Disclosure',
    keywords: ['do not sell', 'third parties', 'consent', 'confidentiality']
  },
  {
    title: 'Your Rights',
    keywords: ['right to request', 'deletion', 'www.help@ecommerceapp.com']
  }
];

test.describe('Privacy Policy Page UI Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/policy');
  });

  test('should display page title correctly', async ({ page }) => {
    await expect(page).toHaveTitle(/Privacy Policy/);
  });

  test('should display privacy policy heading', async ({ page }) => {
    const heading = page.locator('h1:has-text("PRIVACY POLICY")');
    await expect(heading).toBeVisible();
    await expect(heading).toHaveClass(/bg-dark/);
  });

  test('should display policy image', async ({ page }) => {
    const image = page.locator('img[alt="contactus"]');
    await expect(image).toBeVisible();
  });

  test('should have proper layout structure', async ({ page }) => {
    const policyRow = page.locator('.row.contactus');
    await expect(policyRow).toBeVisible();

    const imageColumn = page.locator('.col-md-6');
    const contentColumn = page.locator('.col-md-4');

    await expect(imageColumn).toBeVisible();
    await expect(contentColumn).toBeVisible();
  });

  // loop across all sections to verify heading and content in one test
  for (const section of policySections) {
    test(`should display ${section.title} section with relevant keywords`, async ({ page }) => {
      // section header
      const heading = page.locator(`h5:has-text("${section.title}")`);
      await expect(heading).toBeVisible();

      const pageContent = await page.textContent('body');

      // section body
      // case-insensitive match of the required policy phrases per section
      for (const keyword of section.keywords) {
        expect(pageContent.toLowerCase()).toContain(keyword.toLowerCase());
      }
    });
  }

  test('should have proper list structure for each section', async ({ page }) => {
    // added col-md-4 to the locator to ensure only ul's in the polcy section are included 
    // (not any other ul's in the rest of page anywhere)
    const lists = page.locator('.col-md-4 ul');
    await expect(lists).toHaveCount(policySections.length);
  });
});
