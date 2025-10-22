// import { test, expect } from "@playwright/test";

// // test.describe('E2E: checkout journey', () => {
// //   test('login → browse → add to cart → checkout', async ({ page, baseURL }) => {
// //     // Login (skip if using storageState)
// //     await page.goto(`${baseURL}/login`);
// //     await page.getByTestId('login-email').fill('user@example.com');
// //     await page.getByTestId('login-password').fill('pass1234');
// //     await page.getByTestId('login-submit').click();
// //     await expect(page).toHaveURL(`${baseURL}/`);

// //     // Browse & open a product
// //     await page.goto(`${baseURL}/products`);
// //     await page.getByRole('link', { name: /mint runner/i }).click();
// //     await expect(page.getByRole('heading', { name: /mint runner/i })).toBeVisible();

// //     // Add to cart
// //     await page.getByTestId('add-to-cart').click();
// //     await page.getByTestId('cart-link').click();
// //     await expect(page).toHaveURL(/\/cart/i);
// //     await expect(page.getByText(/mint runner/i)).toBeVisible();

// //     // Proceed to checkout
// //     await page.getByTestId('checkout-button').click();
// //     await expect(page).toHaveURL(/\/checkout/i);

// //     // (If payment gateway is external, stub it)
// //     // Example: page.route to mock your payment API (see Section 7 below)

// //     // Confirm order summary
// //     await expect(page.getByText(/order total/i)).toBeVisible();
// //   });
// // });

// // import { test, expect } from '@playwright/test';

// // test('test', async ({ page }) => {
// //   await page.goto('http://localhost:3000/login');
// //   await page.getByRole('textbox', { name: 'Enter Your Email' }).click();
// //   await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('test001@email.com');
// //   await page.getByRole('textbox', { name: 'Enter Your Password' }).click();
// //   await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('123456');
// //   await page.getByRole('button', { name: 'LOGIN' }).click();
// //   await page.getByRole('button', { name: 'More Details' }).nth(1).click();
// //   await page.getByRole('button', { name: 'ADD TO CART' }).click();
// // });

// import { test, expect } from "@playwright/test";

// test("Able to add products to cart - Login > Click More Details > Click Add to Cart > Verify item added", async ({
//   page,
// }) => {
//   // Step 1: Go to login page
//   await page.goto("http://localhost:3000/login");
//   await expect(page).toHaveTitle(/Login/i); // page title or heading check
//   await expect(page.getByRole("heading", { name: /login/i })).toBeVisible();

//   // Step 2: Fill credentials and submit
//   await page
//     .getByRole("textbox", { name: /enter your email/i })
//     .fill("test001@email.com");
//   await page
//     .getByRole("textbox", { name: /enter your password/i })
//     .fill("123456");
//   await page.getByRole("button", { name: /login/i }).click();

//   // ✅ Assert login success → redirected to home or products page
//   //   await expect(page).toHaveURL(/\/(home|products|)$/i);
//   await expect(page.getByText(/All Products|Home/i)).toBeVisible(); // e.g., greeting or logout button

//   // Step 3: Click "More Details" for a product
//   const detailsButton = page
//     .getByRole("button", { name: /more details/i })
//     .nth(1);
//   await expect(detailsButton).toBeVisible();
//   await detailsButton.click();

//   // ✅ Assert product details page loaded
//   await expect(page).toHaveURL(/\/product\/.+/); // check dynamic product route
//   await expect(
//     page.getByRole("heading", { name: /Product Details/i })
//   ).toBeVisible();

//   // Step 4: Click "Add to Cart"
//   const addToCartButton = page.getByRole("button", { name: /add to cart/i });
//   await expect(addToCartButton).toBeVisible();
//   await addToCartButton.click();

//   // ✅ Assert add-to-cart success
//   // Option A – toast/alert visible
//   await expect(page.getByText(/Item added to cart/i)).toBeVisible();

//   // Option B – cart count updates
//   // await expect(page.getByTestId('cart-count')).toHaveText('1');

//   // Option C – redirect to or confirmation in cart page
//   // await expect(page).toHaveURL(/\/cart/);
//   // await expect(page.getByText(/your cart/i)).toBeVisible();
// });

import { test, expect } from "@playwright/test";

test("Can add current product to cart", async ({ page }) => {
  // 1) Login first
  await page.goto("http://localhost:3000/login");
  await page
    .getByRole("textbox", { name: /enter your email/i })
    .fill("test001@email.com");
  await page
    .getByRole("textbox", { name: /enter your password/i })
    .fill("123456");
  await page.getByRole("button", { name: /login/i }).click();
  await expect(page.getByText(/All Products/i)).toBeVisible();

  // 2) Go to any product details from homepage (first "More Details" on the grid is fine)
  await page
    .getByRole("button", { name: /more details/i })
    .first()
    .click();
  await expect(page).toHaveURL(/\/product\//i);
  await expect(
    page.getByRole("heading", { name: /product details/i })
  ).toBeVisible();

  // 3) Capture the CURRENT product name from the details page
  // Scope to the details column to avoid "Similar Products"
  const details = page.locator(".product-details-info");

  // Find the <h6> that starts with "Name :"
  const nameH6 = details
    .getByRole("heading", { level: 6 })
    .filter({ hasText: /^Name\s*:/i });

  // Get full rendered text and capture after the colon
  const raw = (await nameH6.innerText()) ?? "";
  const match = raw.match(/^Name\s*:\s*(.+)$/i);
  const productName = (match?.[1] ?? "").trim();

  // 4) Click CURRENT product's "ADD TO CART"
  await page
    .getByRole("button", { name: /add to cart/i })
    .first()
    .click();

  // Toast UI feedback check.
  await expect(page.getByText(/Item added to cart/i)).toBeVisible();

  // 5) Open the Cart via the navbar link and verify the same product appears
  await page.getByRole("link", { name: /cart/i }).click();
  await expect(page).toHaveURL(/\/cart/i);

  // Assert the cart contains that product name somewhere in the line item list.
  const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  await expect(
    page.getByRole("img", {
      name: new RegExp(`^${escapeRe(productName)}$`, "i"),
    })
  ).toBeVisible();
});

test("Can add similar products to cart or show message when there is no similar product", async ({
  page,
}) => {
  // 1) Login first
  await page.goto("http://localhost:3000/login");
  await page
    .getByRole("textbox", { name: /enter your email/i })
    .fill("test001@email.com");
  await page
    .getByRole("textbox", { name: /enter your password/i })
    .fill("123456");
  await page.getByRole("button", { name: /login/i }).click();
  await expect(page.getByText(/All Products/i)).toBeVisible();

  // 2) Go to any product details from homepage (first "More Details" on the grid is fine)
  await page
    .getByRole("button", { name: /more details/i })
    .first()
    .click();
  await expect(page).toHaveURL(/\/product\//i);
  await expect(
    page.getByRole("heading", { name: /product details/i })
  ).toBeVisible();

  // 3) Scope to SIMILAR products and identify the first card (if any)
  const similarSection = page.locator(".d-flex.flex-wrap");
  const similarCards = similarSection.locator(".card");

  // If there is at least one similar product…
  if ((await similarCards.count()) > 0) {
    const firstCard = similarCards.first();

    // Read the similar product name (either from <img alt> or the <h5.card-title>)
    const similarName =
      (
        await firstCard.locator("img.card-img-top").getAttribute("alt")
      )?.trim() ||
      (await firstCard.locator(".card-title").first().innerText()).trim();

    expect(similarName).not.toBe("");

    // 4) Click its ADD TO CART within this card
    await firstCard.getByRole("button", { name: /add to cart/i }).click();

    // 5) Go to Cart and assert that exact item is present
    await page.getByRole("link", { name: /cart/i }).click();
    await expect(page).toHaveURL(/\/cart/i);

    // Prefer a scoped assertion to avoid page-wide matches
    const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const cartItemsContainer = page.locator(".mt-2, .cart-items, .cart-list"); // pick the class that wraps your line items
    await expect(
      cartItemsContainer.getByText(
        new RegExp(`^\\s*${escapeRe(similarName)}\\s*$`, "i")
      )
    ).toBeVisible();
  } else {
    await expect(page.getByText(/no similar products found/i)).toBeVisible();
  }
});

test("Can access similar product's details page", async ({ page }) => {
  // 1) Login first
  await page.goto("http://localhost:3000/login");
  await page
    .getByRole("textbox", { name: /enter your email/i })
    .fill("test001@email.com");
  await page
    .getByRole("textbox", { name: /enter your password/i })
    .fill("123456");
  await page.getByRole("button", { name: /login/i }).click();
  await expect(page.getByText(/All Products/i)).toBeVisible();

  // 2) Go to any product details from homepage (first "More Details" on the grid is fine)
  await page
    .getByRole("button", { name: /more details/i })
    .first()
    .click();
  await expect(page).toHaveURL(/\/product\//i);
  await expect(
    page.getByRole("heading", { name: /product details/i })
  ).toBeVisible();

  // 3) Scope to SIMILAR products and identify the first card (if any)
  const similarSection = page.locator(".d-flex.flex-wrap");
  const similarCards = similarSection.locator(".card");

  // If there is at least one similar product…
  if ((await similarCards.count()) > 0) {
    const firstCard = similarCards.first();

    // Read the similar product name (either from <img alt> or the <h5.card-title>)
    const similarName =
      (
        await firstCard.locator("img.card-img-top").getAttribute("alt")
      )?.trim() ||
      (await firstCard.locator(".card-title").first().innerText()).trim();

    expect(similarName).not.toBe("");

    // Capture current product URL to ensure we navigate away later
    const previousProductUrlRegex = page.url();

    // 4) Click on more details button within this card
    await firstCard.getByRole("button", { name: /more details/i }).click();

    // 5) Assert name of product in (3) on product details page
    await expect(
      page.getByRole("heading", { name: /product details/i })
    ).toBeVisible();

    // Scope to the details column to avoid "Similar Products"
    const details = page.locator(".product-details-info");

    const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    await expect(
      details
        .getByRole("heading", { level: 6 })
        .filter({ hasText: /^Name\s*:/i })
    ).toHaveText(
      new RegExp(`^\\s*Name\\s*:\\s*${escapeRe(similarName)}\\s*$`, "i")
    );
    // Ensure we changed products (not still on the original)
    await expect(page).not.toHaveURL(previousProductUrlRegex);
  } else {
    await expect(page.getByText(/no similar products found/i)).toBeVisible();
  }
});

// test("Can add to cart from category products page", async ({ page }) => {
//   await page.goto("http://localhost:3000/login");
//   await page.getByRole("textbox", { name: "Enter Your Email" }).click();
//   await page
//     .getByRole("textbox", { name: "Enter Your Email" })
//     .fill("test001@email.com");
//   await page.getByRole("textbox", { name: "Enter Your Password" }).click();
//   await page
//     .getByRole("textbox", { name: "Enter Your Password" })
//     .fill("123456");
//   await page.getByRole("button", { name: "LOGIN" }).click();
//   await page.getByRole("link", { name: "Categories" }).click();
//   await page.getByRole("link", { name: "All Categories" }).click();
//   await page.getByRole("link", { name: "Electronics" }).click();
//   await page.getByRole("heading", { name: "Category - Electronics" }).click();
//   await page.getByRole("button", { name: "ADD TO CART" }).first().click();
//   await page.getByRole("link", { name: "Cart" }).click();
//   await page.getByText("A powerful laptop").click();
// });

test("Can go to category products page via All Categories and add to cart", async ({
  page,
}) => {
  // 1) Login first
  await page.goto("http://localhost:3000/login");
  await page
    .getByRole("textbox", { name: /enter your email/i })
    .fill("test001@email.com");
  await page
    .getByRole("textbox", { name: /enter your password/i })
    .fill("123456");
  await page.getByRole("button", { name: /login/i }).click();
  await expect(page.getByText(/All Products/i)).toBeVisible();

  // 2) Go to all categories page from homepage
  await page.getByRole("link", { name: /categories/i }).click();
  await page.getByRole("link", { name: /all categories/i }).click();

  // 3) Click on the first category to access the category products page
  // Identify first category
  const categoryLinks = page.locator('a[href^="/category/"]:visible');
  await expect(categoryLinks.first()).toBeVisible();

  const firstCategory = (await categoryLinks.first().innerText()).trim();
  expect(firstCategory).not.toBe("");

  // Click the first category
  await Promise.all([
    page.waitForURL(/\/category\//i),
    categoryLinks.first().click(),
  ]);
  await expect(
    page.getByRole("heading", {
      name: new RegExp(`Category\\s*-\\s*${firstCategory}`, "i"),
    })
  ).toBeVisible();

  // 4) Click "ADD TO CART" for the first product in this category
  const cards = page.locator('.card:has(button:has-text("ADD TO CART"))');
  const count = await cards.count();

  if (count > 0) {
    // Identify the product name from the first card
    const firstCard = cards.first();
    const nameFromTitle = (
      await firstCard.locator(".card-title").first().innerText()
    ).trim();
    const productName = nameFromTitle.trim();
    expect(productName).not.toBe("");

    // Click ADD TO CART
    await firstCard.getByRole("button", { name: /add to cart/i }).click();
    await expect(page.getByText(/Item added to cart/i)).toBeVisible();

    // 5) Go to Cart and assert that exact item is present
    await page.getByRole("link", { name: /cart/i }).click();
    await expect(page).toHaveURL(/\/cart/i);

    // Prefer a scoped assertion to avoid page-wide matches
    const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    await expect(
      page.getByText(new RegExp(`^\\s*${escapeRe(productName)}\\s*$`, "i"))
    ).toBeVisible();
  } else {
    throw new Error(
      `No products with "ADD TO CART" button found in category: ${firstCategory}`
    );
  }
});

test("Can go to category products page directly from Nav Bar", async ({
  page,
}) => {
  // 1) Login first
  await page.goto("http://localhost:3000/login");
  await page
    .getByRole("textbox", { name: /enter your email/i })
    .fill("test001@email.com");
  await page
    .getByRole("textbox", { name: /enter your password/i })
    .fill("123456");
  await page.getByRole("button", { name: /login/i }).click();
  await expect(page.getByText(/All Products/i)).toBeVisible();

  // 2) Click on first category from categories drop-down list that is not "all categories"
  const categoriesToggle = page.locator(".nav-link.dropdown-toggle", {
    hasText: /categories/i,
  });
  await categoriesToggle.click();

  // Wait for the open dropdown menu element (Bootstrap adds .show)
  const menu = page.locator(".dropdown-menu.show");
  await expect(menu).toBeVisible();

  // Select only real category links (exclude "All Categories")
  const realCats = menu.locator('a.dropdown-item[href^="/category/"]'); // singular /category/...
  await expect(realCats.first()).toBeVisible();

  // Capture its name for later assertion
  const firstCategoryName = (await realCats.first().innerText()).trim();
  expect(firstCategoryName).not.toBe("");

  // Click and wait for navigation to a *category* page
  await Promise.all([
    page.waitForURL((url) => /\/category\//.test(url.toString())), // e.g. /category/electronics
    realCats.first().click(),
  ]);

  // Confirm we're on the correct category page
  await expect(
    page.getByRole("heading", {
      name: new RegExp(`Category\\s*-\\s*${firstCategoryName}`, "i"),
    })
  ).toBeVisible();
});

test("Admin can access admin dashboard and view all users", async ({
  page,
}) => {
  // 1) Login as admin
  await page.goto("http://localhost:3000/login");
  await page
    .getByRole("textbox", { name: /enter your email/i })
    .fill("test@admin.com");
  await page
    .getByRole("textbox", { name: /enter your password/i })
    .fill("password");
  await page.getByRole("button", { name: /login/i }).click();

  // Ensure we’re on the home page (navbar visible)
  await expect(page.getByRole("link", { name: /home/i })).toBeVisible();

  // 2) Open the *user* dropdown in navbar (exclude the "Categories" dropdown)
  // Both dropdowns share .nav-link.dropdown-toggle; we pick the one that is NOT "Categories".
  const userToggle = page
    .locator(".nav-link.dropdown-toggle:visible")
    .filter({ hasNotText: /categories/i })
    .first();

  await expect(userToggle).toBeVisible();
  await userToggle.click();

  // 3) In the opened menu, click "Dashboard"
  const menu = page.locator(".dropdown-menu.show");
  await expect(menu).toBeVisible();
  await Promise.all([
    page.waitForURL(/dashboard/i), // e.g. /dashboard or /dashboard/admin
    menu.getByRole("link", { name: /dashboard/i }).click(),
  ]);

  // 4) Verify Admin Panel is present on the dashboard
  await expect(
    page.getByRole("heading", { name: /admin panel/i })
  ).toBeVisible();
  // (Optional) verify key admin links are present
  await expect(
    page.getByRole("link", { name: /create category/i })
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /create product/i })
  ).toBeVisible();
  await expect(page.getByRole("link", { name: /products/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /orders/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /users/i })).toBeVisible();

  // 5) Go to "Users"
  await Promise.all([
    page.waitForURL(/users/i), // e.g. /dashboard/admin/users
    page.getByRole("link", { name: /^users$/i }).click(),
  ]);

  // 6) Verify Admin Panel remains and "All Users" is visible
  await expect(
    page.getByRole("heading", { name: /admin panel/i })
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: /all users/i })).toBeVisible();
});

test.describe("User can only login with valid combination of credentials", () => {
  const validEmail = "test001@email.com";
  const validPassword = "123456";

  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:3000/login");
    await expect(page.getByRole("button", { name: /login/i })).toBeVisible();
  });

  test("rejects correct email + wrong password", async ({ page }) => {
    await page
      .getByRole("textbox", { name: /enter your email/i })
      .fill(validEmail);
    await page
      .getByRole("textbox", { name: /enter your password/i })
      .fill("wrongpass");
    await page.getByRole("button", { name: /login/i }).click();

    await expect(page.getByText(/invalid credentials/i)).toBeVisible();
    await expect(page).toHaveURL(/\/login/i);
  });

  test("rejects wrong email + correct password", async ({ page }) => {
    await page
      .getByRole("textbox", { name: /enter your email/i })
      .fill("wrong@email.com");
    await page
      .getByRole("textbox", { name: /enter your password/i })
      .fill(validPassword);
    await page.getByRole("button", { name: /login/i }).click();

    await expect(page.getByText(/invalid credentials/i)).toBeVisible();
    await expect(page).toHaveURL(/\/login/i);
  });

  test("rejects wrong email + wrong password", async ({ page }) => {
    await page
      .getByRole("textbox", { name: /enter your email/i })
      .fill("nope@email.com");
    await page
      .getByRole("textbox", { name: /enter your password/i })
      .fill("badpass");
    await page.getByRole("button", { name: /login/i }).click();

    await expect(page.getByText(/invalid credentials/i)).toBeVisible();
    await expect(page).toHaveURL(/\/login/i);
  });

  test("accepts correct email + correct password", async ({ page }) => {
    await page
      .getByRole("textbox", { name: /enter your email/i })
      .fill(validEmail);
    await page
      .getByRole("textbox", { name: /enter your password/i })
      .fill(validPassword);
    await page.getByRole("button", { name: /login/i }).click();

    // Should navigate away from /login and show homepage indicators
    await expect(page).not.toHaveURL(/\/login/i);
    await expect(page.getByRole("link", { name: /home/i })).toBeVisible();
    await expect(page.getByText(/all products/i)).toBeVisible();
  });
});
