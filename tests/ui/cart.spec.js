import { test, expect } from '@playwright/test';

test.describe('Cart Page UI Tests', () => {
  test.beforeEach(async ({ page }) => {
    // clear localstorage before each test to start from a fresh empty cart
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('should display empty cart message when cart is empty', async ({ page }) => {
    await page.goto('/cart');

    await expect(page.locator('text=Your Cart Is Empty')).toBeVisible();

    // cart summary is visible
    await expect(page.locator('h2:has-text("Cart Summary")')).toBeVisible();

    // no products
    const productCards = page.locator('.row.card.flex-row');
    await expect(productCards).toHaveCount(0);

    // total is $0.00
    await expect(page.locator('h4:has-text("Total : $0.00")')).toBeVisible();
  });

  test('should add a product to cart from homepage', async ({ page }) => {
    await page.goto('/');

    // await product fetch from backend
    await page.waitForSelector('button:has-text("ADD TO CART")', { timeout: 10000 });

    const firstProductCard = page.locator('.card').first();
    const productName = await firstProductCard.locator('.card-name-price h5').first().textContent();
    const productPrice = await firstProductCard.locator('.card-name-price h5').nth(1).textContent();

    // click "ADD TO CART" for the first product
    await firstProductCard.locator('button:has-text("ADD TO CART")').click();

    // toast
    await expect(page.locator('text=Item Added to cart')).toBeVisible({ timeout: 5000 });

    await page.goto('/cart');

    // 1 item in cart
    await expect(page.locator('text=You Have 1 items in your cart')).toBeVisible();

    // check product card exists
    const cartItems = page.locator('.col-md-7');
    await expect(cartItems.locator(`text=${productName}`).first()).toBeVisible();

    const cartBadge = page.locator('.ant-badge-count');
    await expect(cartBadge).toHaveText('1');
  });

  test('should add multiple products to cart', async ({ page }) => {
    await page.goto('/');

    await page.waitForSelector('button:has-text("ADD TO CART")', { timeout: 10000 });

    const addToCartButtons = page.locator('button:has-text("ADD TO CART")');
    // we assume that atleast 3 products exist (as the DB setup has > 3 products)
    // we choose only first 3
    const count = Math.min(await addToCartButtons.count(), 3);

    for (let i = 0; i < count; i++) {
      await addToCartButtons.nth(i).click();
      await page.waitForTimeout(500);
    }

    await page.goto('/cart');

    await expect(page.locator(`text=You Have ${count} items in your cart`)).toBeVisible();

    const cartBadge = page.locator('.ant-badge-count');
    await expect(cartBadge).toHaveText(count.toString());

    // check 3 product cards exist
    const productCards = page.locator('.row.card.flex-row');
    await expect(productCards).toHaveCount(count);
  });

  test('should remove a product from cart', async ({ page }) => {
    await page.goto('/');

    await page.waitForSelector('button:has-text("ADD TO CART")', { timeout: 10000 });
    await page.locator('button:has-text("ADD TO CART")').first().click();

    await expect(page.locator('text=Item Added to cart')).toBeVisible({ timeout: 5000 });

    await page.goto('/cart');

    await expect(page.locator('text=You Have 1 items in your cart')).toBeVisible();

    await page.locator('button:has-text("Remove")').first().click();

    await expect(page.locator('text=Your Cart Is Empty')).toBeVisible();

    const cartBadge = page.locator('.ant-badge-count');
    await expect(cartBadge).toHaveText('0');

    await expect(page.locator('h4:has-text("Total : $0.00")')).toBeVisible();
  });

  test('should display correct total price in cart', async ({ page }) => {
    await page.goto('/');

    await page.waitForSelector('button:has-text("ADD TO CART")', { timeout: 10000 });

    // calculate price of first 3 products
    const productCards = page.locator('.card');
    const count = Math.min(await productCards.count(), 3);
    let totalPrice = 0;

    for (let i = 0; i < count; i++) {
      const productCard = productCards.nth(i);
      const priceText = await productCard.locator('.card-name-price h5').nth(1).textContent();
      const price = parseFloat(priceText.replace(/[^0-9.]/g, ''));
      totalPrice += price;

      await productCard.locator('button:has-text("ADD TO CART")').click();
      await page.waitForTimeout(500);
    }

    await page.goto('/cart');

    // format total price to actual display string
    const expectedTotal = totalPrice.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
    });

    // total price matches our sum of prices
    await expect(page.locator(`h4:has-text("Total : ${expectedTotal}")`)).toBeVisible();
  });

  test('should persist cart items in localStorage', async ({ page }) => {
    await page.goto('/');

    await page.waitForSelector('button:has-text("ADD TO CART")', { timeout: 10000 });
    await page.locator('button:has-text("ADD TO CART")').first().click();
    await page.waitForTimeout(500);

    const cartData = await page.evaluate(() => localStorage.getItem('cart'));
    expect(cartData).toBeTruthy();

    const cart = JSON.parse(cartData);
    expect(cart.length).toBe(1);

    await page.reload();

    await page.goto('/cart');
    await expect(page.locator('text=You Have 1 items in your cart')).toBeVisible();
  });

  test('should show login prompt for guest users', async ({ page }) => {
    await page.goto('/');

    await page.waitForSelector('button:has-text("ADD TO CART")', { timeout: 10000 });
    await page.locator('button:has-text("ADD TO CART")').first().click();
    await page.waitForTimeout(500);

    await page.goto('/cart');

    await expect(page.locator('text=please login to checkout !')).toBeVisible();

    const loginButton = page.locator('button:has-text("Plase Login to checkout")');
    await expect(loginButton).toBeVisible();
  });

  test('should display cart summary section', async ({ page }) => {
    await page.goto('/');

    await page.waitForSelector('button:has-text("ADD TO CART")', { timeout: 10000 });
    await page.locator('button:has-text("ADD TO CART")').first().click();
    await page.waitForTimeout(500);

    await page.goto('/cart');

    await expect(page.locator('h2:has-text("Cart Summary")')).toBeVisible();
    await expect(page.locator('text=Total | Checkout | Payment')).toBeVisible();
    await expect(page.locator('h4:has-text("Total")')).toBeVisible();
  });

  test('should display product image, name, description and price in cart', async ({ page }) => {
    await page.goto('/');

    await page.waitForSelector('button:has-text("ADD TO CART")', { timeout: 10000 });

    const firstProductCard = page.locator('.card').first();
    const productName = await firstProductCard.locator('.card-name-price h5').first().textContent();

    await firstProductCard.locator('button:has-text("ADD TO CART")').click();
    await page.waitForTimeout(500);

    await page.goto('/cart');

    const cartProductCard = page.locator('.row.card.flex-row').first();

    await expect(cartProductCard.locator('img')).toBeVisible();

    await expect(cartProductCard.locator(`p:has-text("${productName}")`).first()).toBeVisible();

    await expect(cartProductCard.locator('text=Price :')).toBeVisible();

    await expect(cartProductCard.locator('button:has-text("Remove")')).toBeVisible();
  });

  test('should display logged-in user name and address in cart', async ({ page }) => {
    // use test user (email is 'hello@test.com' password is 'password' from populate_db.js)
    await page.goto('/login');

    await page.fill('input[type="email"]', 'hello@test.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button:has-text("LOGIN")');

    await page.waitForTimeout(1000);

    await page.goto('/');
    await page.waitForSelector('button:has-text("ADD TO CART")', { timeout: 10000 });
    await page.locator('button:has-text("ADD TO CART")').first().click();
    await page.waitForTimeout(500);

    await page.goto('/cart');

    await expect(page.locator('text=Hello  Test 3')).toBeVisible();

    // address for this user is 'hell3@test.com'
    await expect(page.locator('h4:has-text("Current Address")')).toBeVisible();
    await expect(page.locator('h5:has-text("hell3@test.com")')).toBeVisible();

    await expect(page.locator('button:has-text("Update Address")')).toBeVisible();

    // no login prompt is shown as user is logged in
    await expect(page.locator('text=please login to checkout !')).not.toBeVisible();
  });

  test('should show update address button for logged-in users', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[type="email"]', 'Daniel@gmail.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button:has-text("LOGIN")');

    await page.waitForTimeout(1000);

    await page.goto('/');
    await page.waitForSelector('button:has-text("ADD TO CART")', { timeout: 10000 });
    await page.locator('button:has-text("ADD TO CART")').first().click();
    await page.waitForTimeout(500);

    await page.goto('/cart');

    await expect(page.locator('text=Hello  Daniel')).toBeVisible();

    await expect(page.locator('h4:has-text("Current Address")')).toBeVisible();
    await expect(page.locator('h5:has-text("60 Daniel Road")')).toBeVisible();

    await expect(page.locator('button:has-text("Update Address")')).toBeVisible();
  });

  test('should not show login message for logged-in user in cart', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[type="email"]', 'hello@test.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button:has-text("LOGIN")');

    await page.waitForTimeout(1000);

    // no need to add products to cart as this login message is independent of the cart state (only the login state)
    await page.goto('/cart');

    // check user name is shown
    await expect(page.locator('text=Hello  Test 3')).toBeVisible();

    // check no login CTA button exists
    await expect(page.locator('text=Your Cart Is Empty')).toBeVisible();
    await expect(page.locator('text=please login to checkout !')).not.toBeVisible();
  });
});


