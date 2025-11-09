import { test, expect } from '@playwright/test';

test.describe('XSS Security Tests', () => {
  let adminAuthToken;
  let xssProductSlug;

  test.beforeAll(async ({ request }) => {
    // use admin account to be able to create products
    const loginResponse = await request.post('http://localhost:6060/api/v1/auth/login', {
      data: {
        email: 'Daniel@gmail.com', // admin user from our sample data
        password: 'password'
      }
    });

    const loginData = await loginResponse.json();
    expect(loginData.success).toBe(true);
    adminAuthToken = loginData.token;
  });

  test('should not execute XSS in product description - script tag injection', async ({ page, request }) => {
    // admin creates a product with XSS payload in description
    const xssPayload = '<script>window.xssExecuted = true; alert("XSS Attack!");</script>';
    const productName = `XSS Test Product ${Date.now()}`;


    const categoriesResponse = await request.get('http://localhost:6060/api/v1/category/get-category');
    const categories = await categoriesResponse.json();
    const categoryId = categories.category[0]._id;


    const formData = new FormData();
    formData.append('name', productName);
    formData.append('description', xssPayload);
    formData.append('price', '999');
    formData.append('quantity', '10');
    formData.append('category', categoryId);

    // dummy image for form
    const dummyImage = Buffer.from('dummy image content');
    formData.append('photo', new Blob([dummyImage], { type: 'image/png' }), 'test.png');

    const createProductResponse = await request.post('http://localhost:6060/api/v1/product/create-product', {
      headers: {
        'Authorization': adminAuthToken
      },
      multipart: formData
    });

    const productData = await createProductResponse.json();
    expect(productData.success).toBe(true);
    xssProductSlug = productData.products.slug;

    // change to a regular user (Not essential, but to actually simulate "Cross-site")
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    await page.goto('/login');
    await page.fill('input[type="email"]', 'hello@test.com'); // non-admin user from DB
    await page.fill('input[type="password"]', 'password');
    await page.click('button:has-text("LOGIN")');
    await page.waitForTimeout(1000);

    // navigate to product with xss payload
    await page.goto(`/product/${xssProductSlug}`);
    await page.waitForSelector('h1:has-text("Product Details")');

    // FE prefills the Description labelm so we have to check and wait for the BE fetched content to load up
    await page.waitForFunction(() => {
      const h6s = document.querySelectorAll('h6');
      for (let h6 of h6s) {
        if (h6.textContent.includes('Description') && h6.textContent.trim().length > 'Description :'.length) {
          return true;
        }
      }
      return false;
    }, { timeout: 10000 });

    // use the variable we set before to check if injected code was executed or not
    const xssExecuted = await page.evaluate(() => window.xssExecuted);
    expect(xssExecuted).toBeUndefined();

    // visual confirmation
    const descriptionText = await page.locator('h6:has-text("Description")').textContent();
    expect(descriptionText).toContain('<script>');
    expect(descriptionText).toContain('</script>');

    // extra check on alert() not causing a popup to open
    page.on('dialog', async () => {
      throw new Error('XSS Alert was triggered');
    });
  });

  test('should not execute XSS with img onerror injection', async ({ page, request }) => {
    // similar process, just different injection method
    const xssPayload = '<img src=x onerror="window.imgXssExecuted=true;alert(\'XSS via img\')">';
    const productName = `XSS Img Test ${Date.now()}`;

    const categoriesResponse = await request.get('http://localhost:6060/api/v1/category/get-category');
    const categories = await categoriesResponse.json();
    const categoryId = categories.category[0]._id;

    const formData = new FormData();
    formData.append('name', productName);
    formData.append('description', xssPayload);
    formData.append('price', '888');
    formData.append('quantity', '5');
    formData.append('category', categoryId);

    const dummyImage = Buffer.from('dummy');
    formData.append('photo', new Blob([dummyImage], { type: 'image/png' }), 'test.png');

    const createResponse = await request.post('http://localhost:6060/api/v1/product/create-product', {
      headers: {
        'Authorization': adminAuthToken
      },
      multipart: formData
    });

    const productData = await createResponse.json();
    const slug = productData.products.slug;

    await page.goto('/');
    await page.evaluate(() => localStorage.clear());

    await page.goto('/login');
    await page.fill('input[type="email"]', 'Daniel@gmail.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button:has-text("LOGIN")');
    await page.waitForTimeout(1000);

    await page.goto(`/product/${slug}`);
    await page.waitForSelector('h1:has-text("Product Details")');

    const imgXssExecuted = await page.evaluate(() => window.imgXssExecuted);
    expect(imgXssExecuted).toBeUndefined();

    const descriptionText = await page.locator('h6:has-text("Description")').textContent();
    expect(descriptionText).toContain('<img');
    expect(descriptionText).toContain('onerror');

    page.on('dialog', async () => {
      throw new Error('XSS Alert via img onerror was triggered!');
    });
  });

  test('should not execute XSS with event handler injection', async ({ page, request }) => {
    const xssPayload = '<div onclick="window.divXssExecuted=true;">Click me for XSS</div>';
    const productName = `XSS Event Test ${Date.now()}`;

    const categoriesResponse = await request.get('http://localhost:6060/api/v1/category/get-category');
    const categories = await categoriesResponse.json();
    const categoryId = categories.category[0]._id;

    const formData = new FormData();
    formData.append('name', productName);
    formData.append('description', xssPayload);
    formData.append('price', '777');
    formData.append('quantity', '3');
    formData.append('category', categoryId);

    const dummyImage = Buffer.from('dummy');
    formData.append('photo', new Blob([dummyImage], { type: 'image/png' }), 'test.png');

    const createResponse = await request.post('http://localhost:6060/api/v1/product/create-product', {
      headers: {
        'Authorization': adminAuthToken
      },
      multipart: formData
    });

    const productData = await createResponse.json();
    const slug = productData.products.slug;

    // we try with guest user as well (this should not have any different behaviour)
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());

    await page.goto(`/product/${slug}`);
    await page.waitForSelector('h1:has-text("Product Details")');

    const descriptionText = await page.locator('h6:has-text("Description")').textContent();
    expect(descriptionText).toContain('<div');
    expect(descriptionText).toContain('onclick');

    const divXssExecuted = await page.evaluate(() => window.divXssExecuted);
    expect(divXssExecuted).toBeUndefined();
  });

  test('should not execute XSS with iframe injection', async ({ page, request }) => {
    const xssPayload = '<iframe src="javascript:alert(\'XSS via iframe\')"></iframe>';
    const productName = `XSS Iframe Test ${Date.now()}`;

    const categoriesResponse = await request.get('http://localhost:6060/api/v1/category/get-category');
    const categories = await categoriesResponse.json();
    const categoryId = categories.category[0]._id;

    const formData = new FormData();
    formData.append('name', productName);
    formData.append('description', xssPayload);
    formData.append('price', '666');
    formData.append('quantity', '2');
    formData.append('category', categoryId);

    const dummyImage = Buffer.from('dummy');
    formData.append('photo', new Blob([dummyImage], { type: 'image/png' }), 'test.png');

    const createResponse = await request.post('http://localhost:6060/api/v1/product/create-product', {
      headers: {
        'Authorization': adminAuthToken
      },
      multipart: formData
    });

    const productData = await createResponse.json();
    const slug = productData.products.slug;

    await page.goto(`/product/${slug}`);
    await page.waitForSelector('h1:has-text("Product Details")');

    const descriptionText = await page.locator('h6:has-text("Description")').textContent();
    expect(descriptionText).toContain('<iframe');

    const iframeCount = await page.locator('iframe').count();
    expect(iframeCount).toBe(0);

    page.on('dialog', async () => {
      throw new Error('XSS Alert via iframe was triggered!');
    });
  });

  test('should not execute XSS with svg onload injection', async ({ page, request }) => {
    const xssPayload = '<svg onload="window.svgXssExecuted=true;alert(\'XSS via SVG\')"></svg>';
    const productName = `XSS SVG Test ${Date.now()}`;

    const categoriesResponse = await request.get('http://localhost:6060/api/v1/category/get-category');
    const categories = await categoriesResponse.json();
    const categoryId = categories.category[0]._id;

    const formData = new FormData();
    formData.append('name', productName);
    formData.append('description', xssPayload);
    formData.append('price', '555');
    formData.append('quantity', '1');
    formData.append('category', categoryId);

    const dummyImage = Buffer.from('dummy');
    formData.append('photo', new Blob([dummyImage], { type: 'image/png' }), 'test.png');

    const createResponse = await request.post('http://localhost:6060/api/v1/product/create-product', {
      headers: {
        'Authorization': adminAuthToken
      },
      multipart: formData
    });

    const productData = await createResponse.json();
    const slug = productData.products.slug;

    await page.goto(`/product/${slug}`);
    await page.waitForSelector('h1:has-text("Product Details")');

    const svgXssExecuted = await page.evaluate(() => window.svgXssExecuted);
    expect(svgXssExecuted).toBeUndefined();

    const descriptionText = await page.locator('h6:has-text("Description")').textContent();
    expect(descriptionText).toContain('<svg');
    expect(descriptionText).toContain('onload');

    page.on('dialog', async () => {
      throw new Error('XSS Alert via SVG was triggered!');
    });
  });

  test('should not execute XSS with javascript: protocol in anchor tag', async ({ page, request }) => {
    const xssPayload = '<a href="javascript:alert(\'XSS\')">Click me</a>';
    const productName = `XSS Link Test ${Date.now()}`;

    const categoriesResponse = await request.get('http://localhost:6060/api/v1/category/get-category');
    const categories = await categoriesResponse.json();
    const categoryId = categories.category[0]._id;

    const formData = new FormData();
    formData.append('name', productName);
    formData.append('description', xssPayload);
    formData.append('price', '444');
    formData.append('quantity', '8');
    formData.append('category', categoryId);

    const dummyImage = Buffer.from('dummy');
    formData.append('photo', new Blob([dummyImage], { type: 'image/png' }), 'test.png');

    const createResponse = await request.post('http://localhost:6060/api/v1/product/create-product', {
      headers: {
        'Authorization': adminAuthToken
      },
      multipart: formData
    });

    const productData = await createResponse.json();
    const slug = productData.products.slug;

    await page.goto(`/product/${slug}`);
    await page.waitForSelector('h1:has-text("Product Details")');

    const descriptionText = await page.locator('h6:has-text("Description")').textContent();
    expect(descriptionText).toContain('<a');
    expect(descriptionText).toContain('javascript:');

    page.on('dialog', async () => {
      throw new Error('XSS Alert via javascript: protocol was triggered!');
    });
  });

  test('should handle XSS attempts in product name as well', async ({ page, request }) => {
    const xssName = '<script>window.nameXss=true</script>Malicious Product';
    const productDescription = 'Normal description';

    const categoriesResponse = await request.get('http://localhost:6060/api/v1/category/get-category');
    const categories = await categoriesResponse.json();
    const categoryId = categories.category[0]._id;

    const formData = new FormData();
    formData.append('name', xssName);
    formData.append('description', productDescription);
    formData.append('price', '333');
    formData.append('quantity', '4');
    formData.append('category', categoryId);

    const dummyImage = Buffer.from('dummy');
    formData.append('photo', new Blob([dummyImage], { type: 'image/png' }), 'test.png');

    const createResponse = await request.post('http://localhost:6060/api/v1/product/create-product', {
      headers: {
        'Authorization': adminAuthToken
      },
      multipart: formData
    });

    const productData = await createResponse.json();
    const slug = productData.products.slug;

    await page.goto(`/product/${slug}`);
    await page.waitForSelector('h1:has-text("Product Details")');

    const nameXss = await page.evaluate(() => window.nameXss);
    expect(nameXss).toBeUndefined();

    // Verify script tag in name is rendered as text
    const nameText = await page.locator('h6:has-text("Name")').textContent();
    expect(nameText).toContain('<script>');

    page.on('dialog', async () => {
      throw new Error('XSS Alert via product name was triggered!');
    });
  });
});
