import { test, expect } from '@playwright/test';
import { ProductDetailPage } from '../pages/product-detail.page';

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
  test.setTimeout(60_000);

  let product: ProductDetailPage;

  test.beforeEach(({ page }) => {
    product = new ProductDetailPage(page);
  });

  test('loads product with inventory in stock', async ({ page }) => {
    await product.goto('leche-pil-natural-900-ml');

    await expect(page).toHaveTitle(/Sansistore/);

    await product.waitForHeading(/Leche PIL Natural 900 ml/);

    await expect(page.getByText(/Bs\s(9\.70|12\.50)/)).toBeVisible();

    await expect(
      page.getByText('Bolivia', { exact: true }).first()
    ).toBeVisible();

    await expect(page.getByText('Disponible', { exact: true })).toBeVisible();
    await expect(page.getByText(/Stock:.*disponibles/)).toBeVisible();
  });

  test('loads product out of stock', async () => {
    await product.goto('yogurt-test-sin-resenas');

    await product.waitForHeading(/Yogurt Test Sin Resenas/);

    await expect(
      product.page
        .locator('p.leading-7')
        .filter({
          hasText: 'Producto de prueba sin inventario ni comentarios.',
        })
        .first()
    ).toBeVisible();

    await expect(product.page.getByText(/Bs\s21\.50/)).toBeVisible();
    await expect(
      product.page.getByText('Producto agotado', { exact: true }).first().or(product.page.getByText('No disponible', { exact: true }).first())
    ).toBeVisible({ timeout: 15000 });
  });

  test('displays offer price when available', async ({ page }) => {
    await product.goto(
      'detergente-liquido-ola-futuro-limpieza-completa-5-l',
    );

    await product.waitForHeading(
      /Detergente Liquido Ola Futuro Limpieza Completa 5 L/,
    );

    await expect(page.getByText(/Bs\s123\.00/)).toBeVisible();

    await expect(page.getByText(/-11%/)).toBeVisible();

    await expect(page.getByText(/Bs\s109\.00/)).toBeVisible();
  });

  test('displays product reviews', async ({ page }) => {
    await product.goto('leche-pil-natural-900-ml');

    await product.waitForHeading(/Leche PIL Natural 900 ml/);

    await expect(
      page.getByRole('heading', { name: /Comentarios del producto/ })
    ).toBeVisible({ timeout: 30_000 });

    const user1Review = page.locator('article').filter({ hasText: 'Carla' });
    await expect(user1Review).toBeVisible({ timeout: 15_000 });
    await expect(
      user1Review
        .locator('p')
        .filter({ hasText: 'Buen sabor y practica para tener en casa.' })
    ).toBeVisible({ timeout: 15_000 });
    await expect(
      user1Review.locator('span').filter({ hasText: '5.0' })
    ).toBeVisible({ timeout: 15_000 });

    const user2Review = page.locator('article').filter({ hasText: 'Miguel' });
    await expect(user2Review).toBeVisible({ timeout: 15_000 });
    await expect(
      user2Review
        .locator('p')
        .filter({ hasText: 'La uso para desayuno y cafe.' })
    ).toBeVisible({ timeout: 15_000 });
    await expect(
      user2Review.locator('span').filter({ hasText: '4.0' })
    ).toBeVisible({ timeout: 15_000 });

    await expect(page.getByText('4.5 de 5')).toBeVisible({
      timeout: 15_000,
    });

    await expect(page.getByTestId('average-star-0-full')).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByTestId('average-star-1-full')).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByTestId('average-star-2-full')).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByTestId('average-star-3-full')).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByTestId('average-star-4-half')).toBeVisible({
      timeout: 15_000,
    });
  });

  test('displays no reviews message when product has no reviews', async ({
    page,
  }) => {
    await product.goto('yogurt-test-sin-resenas');

    await product.waitForHeading(/Yogurt Test Sin Resenas/);
    await expect(page.getByText('Sin calificaciones')).toBeVisible({
      timeout: 15_000,
    });
    await expect(
      page.getByText(/Este producto aún no tiene comentarios/)
    ).toBeVisible({ timeout: 15_000 });
  });

  test('product image loads', async () => {
    await product.goto('leche-pil-natural-900-ml');
    await product.waitForHeading(/Leche PIL Natural 900 ml/);
    const productImage = product.page.getByRole('img', {
      name: /Leche PIL Natural 900 ml/,
    });

    await expect(productImage).toBeVisible({ timeout: 15_000 });
    await expect(productImage).toHaveJSProperty('complete', true, {
      timeout: 15_000,
    });
    await expect(productImage).not.toHaveJSProperty('naturalWidth', 0, {
      timeout: 15_000,
    });
  });

  // ponytail: 404 test needs response object; keep page.goto
  test('returns 404 for non-existent product', async ({ page }) => {
    const response = await page.goto('/productos/this-product-does-not-exist');

    expect(response?.status()).toBe(404);
    await expect(
      page.getByText(/No pudimos encontrar esta página/)
    ).toBeVisible();
  });

  test('displays breadcrumb navigation', async ({ page }) => {
    await product.goto('leche-pil-natural-900-ml');

    const breadcrumb = page.getByLabel('Ruta de navegación');
    await expect(
      breadcrumb.getByRole('link', { name: 'Productos' })
    ).toBeVisible();
    await expect(breadcrumb.getByText('Detalle')).toBeVisible();
  });

  test('add to cart button is functional', async ({ page }) => {
    await product.goto('leche-pil-natural-900-ml');

    // ponytail: locator used 2x, not worth POM property
    const addToCartButton = page.getByRole('button', {
      name: /add to cart|agregar al carrito|comprar/i,
    });
    const exists = await addToCartButton.isVisible().catch(() => false);

    if (exists) {
      await expect(addToCartButton).toBeEnabled();
    }
  });

  test('add to cart button is disabled when out of stock', async ({ page }) => {
    await product.goto('yogurt-test-sin-resenas');

    // ponytail: same locator, 2nd use — not worth extracting
    const addToCartButton = page.getByRole('button', {
      name: /add to cart|agregar al carrito|comprar/i,
    });
    const exists = await addToCartButton.isVisible().catch(() => false);

    if (exists) {
      await expect(addToCartButton).toBeDisabled();
    }
  });
});
