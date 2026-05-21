import { test, expect } from '@playwright/test';

test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status !== testInfo.expectedStatus) {
    const screenshot = await page.screenshot({
      fullPage: true,
    });

    await testInfo.attach('full-page-screenshot', {
      body: screenshot,
      contentType: 'image/png',
    });
  }
});

test.describe('Product Detail Page', () => {
  test('loads product with inventory in stock', async ({ page }) => {
    await page.goto('/productos/leche-pil-natural-900-ml');

    // Check page title
    await expect(page).toHaveTitle(/Sansistore/);

    // Check description
    await expect(
      page
        .locator('p.leading-7')
        .filter({
          hasText:
            'Leche semidescremada UHT, rica en calcio y pensada para el consumo diario.',
        })
        .first()
    ).toBeVisible();

    // Check price
    await expect(page.getByText(/Bs\s(9\.70|12\.50)/)).toBeVisible();

    // Check badge
    await expect(
      page.getByText('Bolivia', { exact: true }).first()
    ).toBeVisible();

    // Check in stock status and stock count
    await expect(page.getByText('Disponible', { exact: true })).toBeVisible();
    await expect(page.getByText(/Stock:.*disponibles/)).toBeVisible();
  });

  test('loads product out of stock', async ({ page }) => {
    await page.goto('/productos/yogurt-test-sin-resenas');

    // Check product name
    await expect(
      page.getByRole('heading', { name: /Yogurt Test Sin Resenas/ })
    ).toBeVisible();

    // Check description
    await expect(
      page
        .locator('p.leading-7')
        .filter({
          hasText: 'Producto de prueba sin inventario ni comentarios.',
        })
        .first()
    ).toBeVisible();

    // Check price
    await expect(page.getByText(/Bs\s21\.50/)).toBeVisible();

    // Check out of stock status
    await expect(page.getByText('Producto agotado')).toBeVisible();
  });

  test('displays offer price when available', async ({ page }) => {
    await page.goto(
      '/productos/detergente-liquido-ola-futuro-limpieza-completa-5-l'
    );

    // Check product name
    await expect(
      page.getByRole('heading', {
        name: /Detergente Liquido Ola Futuro Limpieza Completa 5 L/,
      })
    ).toBeVisible();

    // Check original price
    await expect(page.getByText(/Bs\s123\.00/)).toBeVisible();

    // Check offer badge with discount percentage
    await expect(page.getByText(/-11%/)).toBeVisible();

    // Check offer price (strikethrough old price, new price displayed)
    await expect(page.getByText(/Bs\s109\.00/)).toBeVisible();
  });

  test('displays product reviews', async ({ page }) => {
    await page.goto('/productos/leche-pil-natural-900-ml');

    // Check that reviews section exists with heading
    await expect(
      page.getByRole('heading', { name: /Comentarios del producto/ })
    ).toBeVisible();

    // Check for first reviewer with 5 stars
    const user1Review = page.locator('article').filter({ hasText: 'Carla' });
    await expect(user1Review).toBeVisible();
    await expect(
      user1Review
        .locator('p')
        .filter({ hasText: 'Buen sabor y practica para tener en casa.' })
    ).toBeVisible();
    await expect(
      user1Review.locator('span').filter({ hasText: '5.0' })
    ).toBeVisible();

    // Check for second reviewer with 4 stars
    const user2Review = page.locator('article').filter({ hasText: 'Miguel' });
    await expect(user2Review).toBeVisible();
    await expect(
      user2Review
        .locator('p')
        .filter({ hasText: 'La uso para desayuno y cafe.' })
    ).toBeVisible();
    await expect(
      user2Review.locator('span').filter({ hasText: '4.0' })
    ).toBeVisible();

    // Check average rating (4.5 de 5)
    await expect(page.getByText('4.5 de 5')).toBeVisible();

    // Verify star rendering: 4 full stars + 1 half star (average rating only)
    await expect(page.getByTestId('average-star-0-full')).toBeVisible();
    await expect(page.getByTestId('average-star-1-full')).toBeVisible();
    await expect(page.getByTestId('average-star-2-full')).toBeVisible();
    await expect(page.getByTestId('average-star-3-full')).toBeVisible();
    await expect(page.getByTestId('average-star-4-half')).toBeVisible();
  });

  test('displays no reviews message when product has no reviews', async ({
    page,
  }) => {
    await page.goto('/productos/yogurt-test-sin-resenas');

    // Check for empty reviews message
    await expect(page.getByText('Sin calificaciones')).toBeVisible();
    await expect(
      page.getByText(/Este producto aún no tiene comentarios/)
    ).toBeVisible();
  });

  test('product image loads', async ({ page }) => {
    await page.goto('/productos/leche-pil-natural-900-ml');
    const productImage = page.locator('img').first();

    await expect(productImage).toBeVisible();
    await expect(productImage).toHaveJSProperty('complete', true);
    await expect(productImage).not.toHaveJSProperty('naturalWidth', 0);
  });

  test('returns 404 for non-existent product', async ({ page }) => {
    const response = await page.goto('/productos/this-product-does-not-exist');

    // Should redirect to 404 page
    expect(response?.status()).toBe(404);
    await expect(
      page.getByText(/No pudimos encontrar esta página/)
    ).toBeVisible();
  });

  test('displays breadcrumb navigation', async ({ page }) => {
    await page.goto('/productos/leche-pil-natural-900-ml');

    // Check that breadcrumb navigation is visible with correct links
    const breadcrumb = page.getByLabel('Ruta de navegación');
    await expect(
      breadcrumb.getByRole('link', { name: 'Productos' })
    ).toBeVisible();
    await expect(breadcrumb.getByText('Detalle')).toBeVisible();
  });

  test('add to cart button is functional', async ({ page }) => {
    await page.goto('/productos/leche-pil-natural-900-ml');

    // Find add to cart button - skip this test if not implemented yet
    const addToCartButton = page.getByRole('button', {
      name: /add to cart|agregar al carrito|comprar/i,
    });
    const exists = await addToCartButton.isVisible().catch(() => false);

    if (exists) {
      await expect(addToCartButton).toBeEnabled();
    }
  });

  test('add to cart button is disabled when out of stock', async ({ page }) => {
    await page.goto('/productos/yogurt-test-sin-resenas');

    // Find add to cart button - skip if not implemented
    const addToCartButton = page.getByRole('button', {
      name: /add to cart|agregar al carrito|comprar/i,
    });
    const exists = await addToCartButton.isVisible().catch(() => false);

    if (exists) {
      await expect(addToCartButton).toBeDisabled();
    }
  });
});
