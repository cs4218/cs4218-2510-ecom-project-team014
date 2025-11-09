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

test.describe("AuthZ: regular user blocked from admin pages", () => {
  const BASE = "http://localhost:3000";
  const adminPaths = [
    "/dashboard/admin",
    "/dashboard/admin/create-category",
    "/dashboard/admin/create-product",
    "/dashboard/admin/products",
    "/dashboard/admin/orders",
    "/dashboard/admin/users",
  ];
  test.beforeEach(async ({ page }) => {
    // Login as a regular user
    await page.goto(`${BASE}/login`);
    await page
      .getByRole("textbox", { name: /enter your email/i })
      .fill("test001@email.com");
    await page
      .getByRole("textbox", { name: /enter your password/i })
      .fill("123456");
    await page.getByRole("button", { name: /login/i }).click();
    await expect(page.getByText(/all products/i)).toBeVisible();
  });

  for (const path of adminPaths) {
    test(`renders 401 (blocked): ${path}`, async ({ page }) => {
      // 1) Assert at least one 401 occurs during navigation/auth check
      const wait401 = page.waitForResponse(
        (res) =>
          res.status() === 401 &&
          /\/(auth|dashboard|admin|api)\//i.test(res.url())
      );

      const nav = page.goto(`${BASE}${path}`, {
        waitUntil: "domcontentloaded",
      });

      await Promise.all([wait401, nav]);

      // 2) If a dev overlay iframe appears, assert the 401 text inside it
      //    Common titles/ids used by CRA/Vite overlays:
      const overlayFrame = page.frameLocator(
        'iframe[title*="Runtime error"], iframe#webpack-dev-server-client-overlay'
      );

      // Try to assert 401 text inside overlay if the iframe exists; otherwise skip
      const overlayExists = await overlayFrame.locator("body").count();
      if (overlayExists > 0) {
        await expect(
          overlayFrame.getByText(/request failed with status code 401/i)
        ).toBeVisible({ timeout: 10000 });
        // Optional heading:
        // await expect(overlayFrame.getByText(/^uncaught runtime errors:/i)).toBeVisible();
      } else {
        // If no overlay, still assert some unauthorized text on the page if your app renders one
        const denial = page.getByText(
          /(401|unauthorized|access denied|forbidden|not authorized)/i
        );
        if (await denial.count()) {
          await expect(denial.first()).toBeVisible();
        }
      }

      // 3) Ensure no admin UI renders
      await expect(
        page.getByRole("heading", { name: /admin panel/i })
      ).toHaveCount(0);
    });
  }
});

const BASE = "http://localhost:3000";
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

test.describe("Search results interactions", () => {
  test.beforeEach(async ({ page }) => {
    // Login first so "ADD TO CART" is allowed
    await page.goto(`${BASE}/login`);
    await page
      .getByRole("textbox", { name: /enter your email/i })
      .fill("test001@email.com");
    await page
      .getByRole("textbox", { name: /enter your password/i })
      .fill("123456");
    await page.getByRole("button", { name: /login/i }).click();

    // Land on home
    await expect(page.getByRole("link", { name: /home/i })).toBeVisible();
  });

  test("Add to cart from search results", async ({ page }) => {
    // 1) Search for "book" from the homepage
    await page.getByRole("searchbox", { name: /search/i }).fill("book");
    await page.getByRole("button", { name: /^search$/i }).click();

    // 2) Verify search results page and cards rendered

    await Promise.all([
      page.waitForURL(/\/search/i), // or whatever your search route is
      page.getByRole("button", { name: /^search$/i }).click(),
    ]);

    // Give the page a moment to render results (SPA fetch)
    await page.waitForLoadState("networkidle");

    // Assert the heading in a role-agnostic way (any h1..h6 with that text)
    const resultsHeading = page
      .locator("h1,h2,h3,h4,h5,h6")
      .filter({ hasText: /^\s*Search Results\s*$/i });

    await expect(resultsHeading).toBeVisible({ timeout: 10_000 });

    const cards = page.locator('.card:has(button:has-text("ADD TO CART"))');
    await expect(cards.first()).toBeVisible();

    // Capture product name from the first result card
    const firstCard = cards.first();
    const title = (
      await firstCard.locator(".card-title").first().innerText()
    ).trim();
    const alt = (
      await firstCard.locator("img.card-img-top").getAttribute("alt")
    )?.trim();
    const productName = (title || alt || "").trim();
    expect(productName).not.toBe("");

    // 3) Add to cart from the card
    await Promise.all([
      page.waitForLoadState("networkidle"),
      firstCard.getByRole("button", { name: /add to cart/i }).click(),
    ]);

    // 4) Go to Cart and assert item present
    await Promise.all([
      page.waitForURL(/\/cart/i),
      page.getByRole("link", { name: /cart/i }).click(),
    ]);
    await page.waitForSelector(".cart-summary, .mt-2 img, .cart-item", {
      timeout: 10000,
    });

    // Prefer image alt match; also allow text match as fallback
    await expect(
      page.getByRole("img", {
        name: new RegExp(`^${escapeRe(productName)}$`, "i"),
      })
    ).toBeVisible({ timeout: 10000 });
    await expect(
      page.getByText(new RegExp(`^\\s*${escapeRe(productName)}\\s*$`, "i"))
    ).toBeVisible({ timeout: 10_000 });
  });

  test('Open product details via "More Details" from search results', async ({
    page,
  }) => {
    // 1) Search for "book"
    await page.getByRole("searchbox", { name: /search/i }).fill("book");
    await page.getByRole("button", { name: /^search$/i }).click();
    await Promise.all([
      page.waitForURL(/\/search/i), // or whatever your search route is
      page.getByRole("button", { name: /^search$/i }).click(),
    ]);

    // Give the page a moment to render results (SPA fetch)
    await page.waitForLoadState("networkidle");

    // Assert the heading in a role-agnostic way (any h1..h6 with that text)
    const resultsHeading = page
      .locator("h1,h2,h3,h4,h5,h6")
      .filter({ hasText: /^\s*Search Results\s*$/i });

    await expect(resultsHeading).toBeVisible({ timeout: 10_000 });

    // 2) Grab the first result card + its name
    const cards = page.locator('.card:has(button:has-text("More Details"))');
    await expect(cards.first()).toBeVisible();

    const firstCard = cards.first();
    const title = (
      await firstCard.locator(".card-title").first().innerText()
    ).trim();
    const alt = (
      await firstCard.locator("img.card-img-top").getAttribute("alt")
    )?.trim();
    const resultName = (title || alt || "").trim();
    expect(resultName).not.toBe("");

    // 3) Click "More Details" inside that card
    await Promise.all([
      page.waitForURL(/\/product\//i),
      firstCard.getByRole("button", { name: /more details/i }).click(),
    ]);

    // 4) Assert we’re on product details and the name matches
    await expect(
      page.getByRole("heading", { name: /product details/i })
    ).toBeVisible();

    // Wait for navigation + data to load
    await expect(page).toHaveURL(/\/product\//i);
    await page.waitForLoadState("networkidle"); // allows the product fetch to complete

    // Find the "Name :" line inside the details column and assert exact text
    const nameLine = page
      .locator(".product-details-info h6") // all h6 in the details section
      .filter({ hasText: /^Name\s*:/i }); // the "Name :" row

    await expect(nameLine).toBeVisible({ timeout: 10_000 });
    await expect(nameLine).toHaveText(
      new RegExp(`^\\s*Name\\s*:\\s*${escapeRe(resultName)}\\s*$`, "i"),
      { timeout: 10_000 }
    );
  });
});
