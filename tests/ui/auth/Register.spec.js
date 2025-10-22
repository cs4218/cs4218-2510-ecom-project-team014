import { test, expect } from '@playwright/test';

const REGISTER_URL = 'http://localhost:3000/register';

const validFields = {
  name: 'John Doe',
  email: 'john@example.com',
  password: 'Passw0rd!',
  phone: '0123456789',
  address: 'Address 123',
  DOB: '2000-01-01',
  answer: 'Football'
};

test.describe('Register Page UI - Real E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(REGISTER_URL);
  });

  test('should render registration form', async ({ page }) => {
    await expect(page.getByText('REGISTER FORM')).toBeVisible();
    await expect(page.getByPlaceholder('Enter Your Name')).toBeVisible();
    await expect(page.getByPlaceholder('Enter Your Email')).toBeVisible();
    await expect(page.getByPlaceholder('Enter Your Password')).toBeVisible();
    await expect(page.getByPlaceholder('Enter Your Phone')).toBeVisible();
    await expect(page.getByPlaceholder('Enter Your Address')).toBeVisible();
    await expect(page.locator('input[type="date"]')).toBeVisible();
    await expect(page.getByPlaceholder('What is Your Favorite sports')).toBeVisible();
    await expect(page.getByRole('button', { name: 'REGISTER' })).toBeVisible();
  });

  const requiredFields = [
    { label: 'name', placeholder: 'Enter Your Name' },
    { label: 'email', placeholder: 'Enter Your Email' },
    { label: 'password', placeholder: 'Enter Your Password' },
    { label: 'phone', placeholder: 'Enter Your Phone' },
    { label: 'address', placeholder: 'Enter Your Address' },
    { label: 'DOB', selector: 'input[type="date"]' },
    { label: 'answer', placeholder: 'What is Your Favorite sports' }
  ];

  requiredFields.forEach((field, idx) => {
    test(`should fail to register if ${field.label} is missing`, async ({ page }) => {
      for (let i = 0; i < requiredFields.length; i++) {
        if (i !== idx) {
          if (requiredFields[i].label === 'DOB') {
            await page.locator(requiredFields[i].selector).fill(validFields.DOB);
          } else {
            await page.getByPlaceholder(requiredFields[i].placeholder).fill(validFields[requiredFields[i].label]);
          }
        }
      }

      if (field.label === 'DOB') {
        await page.locator(field.selector).fill('');
      } else {
        await page.getByPlaceholder(field.placeholder).fill('');
      }

      await page.getByRole('button', { name: 'REGISTER' }).click();
      await expect(page).toHaveURL(REGISTER_URL);
    });
  });

  test('should fail to register when name is too long', async ({ page }) => {
    await page.getByPlaceholder('Enter Your Name').fill('J'.repeat(101));
    await page.getByPlaceholder('Enter Your Email').fill(validFields.email);
    await page.getByPlaceholder('Enter Your Password').fill(validFields.password);
    await page.getByPlaceholder('Enter Your Phone').fill(validFields.phone);
    await page.getByPlaceholder('Enter Your Address').fill(validFields.address);
    await page.locator('input[type="date"]').fill(validFields.DOB);
    await page.getByPlaceholder('What is Your Favorite sports').fill(validFields.answer);
    await page.getByRole('button', { name: 'REGISTER' }).click();
    await expect(page).toHaveURL(REGISTER_URL);
  });

  test('should fail to register for invalid email format', async ({ page }) => {
    await page.getByPlaceholder('Enter Your Name').fill(validFields.name);
    await page.getByPlaceholder('Enter Your Email').fill('invalid-email');
    await page.getByPlaceholder('Enter Your Password').fill(validFields.password);
    await page.getByPlaceholder('Enter Your Phone').fill(validFields.phone);
    await page.getByPlaceholder('Enter Your Address').fill(validFields.address);
    await page.locator('input[type="date"]').fill(validFields.DOB);
    await page.getByPlaceholder('What is Your Favorite sports').fill(validFields.answer);
    await page.getByRole('button', { name: 'REGISTER' }).click();
    await expect(page).toHaveURL(REGISTER_URL);
  });

  test('should fail to register if password is too short', async ({ page }) => {
    await page.getByPlaceholder('Enter Your Name').fill(validFields.name);
    await page.getByPlaceholder('Enter Your Email').fill(validFields.email);
    await page.getByPlaceholder('Enter Your Password').fill('abc');
    await page.getByPlaceholder('Enter Your Phone').fill(validFields.phone);
    await page.getByPlaceholder('Enter Your Address').fill(validFields.address);
    await page.locator('input[type="date"]').fill(validFields.DOB);
    await page.getByPlaceholder('What is Your Favorite sports').fill(validFields.answer);
    await page.getByRole('button', { name: 'REGISTER' }).click();
    await expect(page).toHaveURL(REGISTER_URL);
  });

  test('should fail to register if phone length is too long', async ({ page }) => {
    await page.getByPlaceholder('Enter Your Name').fill(validFields.name);
    await page.getByPlaceholder('Enter Your Email').fill(validFields.email);
    await page.getByPlaceholder('Enter Your Password').fill(validFields.password);
    await page.getByPlaceholder('Enter Your Phone').fill('1'.repeat(21));
    await page.getByPlaceholder('Enter Your Address').fill(validFields.address);
    await page.locator('input[type="date"]').fill(validFields.DOB);
    await page.getByPlaceholder('What is Your Favorite sports').fill(validFields.answer);
    await page.getByRole('button', { name: 'REGISTER' }).click();
    await expect(page).toHaveURL(REGISTER_URL);
  });

  test('should fail to register if address length is too long', async ({ page }) => {
    await page.getByPlaceholder('Enter Your Name').fill(validFields.name);
    await page.getByPlaceholder('Enter Your Email').fill(validFields.email);
    await page.getByPlaceholder('Enter Your Password').fill(validFields.password);
    await page.getByPlaceholder('Enter Your Phone').fill(validFields.phone);
    await page.getByPlaceholder('Enter Your Address').fill('A'.repeat(151));
    await page.locator('input[type="date"]').fill(validFields.DOB);
    await page.getByPlaceholder('What is Your Favorite sports').fill(validFields.answer);
    await page.getByRole('button', { name: 'REGISTER' }).click();
    await expect(page).toHaveURL(REGISTER_URL);
  });

  test('should fail to register if answer length is too long', async ({ page }) => {
    await page.getByPlaceholder('Enter Your Name').fill(validFields.name);
    await page.getByPlaceholder('Enter Your Email').fill(validFields.email);
    await page.getByPlaceholder('Enter Your Password').fill(validFields.password);
    await page.getByPlaceholder('Enter Your Phone').fill(validFields.phone);
    await page.getByPlaceholder('Enter Your Address').fill(validFields.address);
    await page.locator('input[type="date"]').fill(validFields.DOB);
    await page.getByPlaceholder('What is Your Favorite sports').fill('A'.repeat(51));
    await page.getByRole('button', { name: 'REGISTER' }).click();
    await expect(page).toHaveURL(REGISTER_URL);
  });

  test('should fail to register if email already registered', async ({ page }) => {
    await page.getByPlaceholder('Enter Your Name').fill(validFields.name);
    await page.getByPlaceholder('Enter Your Email').fill('cs4218@test.com');
    await page.getByPlaceholder('Enter Your Password').fill(validFields.password);
    await page.getByPlaceholder('Enter Your Phone').fill(validFields.phone);
    await page.getByPlaceholder('Enter Your Address').fill(validFields.address);
    await page.locator('input[type="date"]').fill(validFields.DOB);
    await page.getByPlaceholder('What is Your Favorite sports').fill(validFields.answer);
    await page.getByRole('button', { name: 'REGISTER' }).click();
    await expect(page).toHaveURL(REGISTER_URL);
  }); 



  test('should register successfully and navigate to login page', async ({ page, request }) => {
    const testEmail = 'new11a2@user.com';

    await page.getByPlaceholder('Enter Your Name').fill('New User11');
    await page.getByPlaceholder('Enter Your Email').fill(testEmail);
    await page.getByPlaceholder('Enter Your Password').fill('goodPassword');
    await page.getByPlaceholder('Enter Your Phone').fill('0123456789');
    await page.getByPlaceholder('Enter Your Address').fill('Address 123');
    await page.locator('input[type="date"]').fill('2000-01-01');
    await page.getByPlaceholder('What is Your Favorite sports').fill('Football');
    await page.getByRole('button', { name: 'REGISTER' }).click();
    await expect(page).toHaveURL('http://localhost:3000/login', { timeout: 10000 });

    // Clean up: Remove the test user from the DB immediately after test
    const deleteResponse = await request.delete(`http://localhost:3000/api/v1/test/delete-user/${encodeURIComponent(testEmail)}`);
    expect(deleteResponse.ok()).toBe(true);
  });
});

// Above tests are generated with the help of AI
