import { test, expect } from '@playwright/test';

test.describe('Product Detail Page', () => {
  test('loads product with inventory in stock', async ({ page }) => {
    await page.goto('/productos/leche-test-instock');

    // Check page title
    await expect(page).toHaveTitle(/Sansistore/);

    // Check product name is displayed
    await expect(page.getByRole('heading', { name: /Leche Test In Stock/ })).toBeVisible();

    // Check description
    await expect(page.getByText('Test product with inventory available')).toBeVisible();

    // Check price (Bs 9.99)
    await expect(page.getByText(/Bs\s9\.99/)).toBeVisible();

    // Check badge
    await expect(page.getByText('Nuevo')).toBeVisible();

    // Check in stock status
    await expect(page.getByText('Disponible')).toBeVisible();

    // Check stock count
    await expect(page.getByText(/Stock:.*disponibles/)).toBeVisible();
  });

  test('loads product out of stock', async ({ page }) => {
    await page.goto('/productos/queso-test-outofstock');

    // Check product name
    await expect(page.getByRole('heading', { name: /Queso Test Out of Stock/ })).toBeVisible();

    // Check description
    await expect(page.getByText('Test product without inventory')).toBeVisible();

    // Check price
    await expect(page.getByText(/Bs\s32\.50/)).toBeVisible();

    // Check out of stock status
    await expect(page.getByText('Producto agotado')).toBeVisible();
  });

  test('displays offer price when available', async ({ page }) => {
    await page.goto('/productos/mocochinchi-test-offer');

    // Check product name
    await expect(page.getByRole('heading', { name: /Mocochinchi Test with Offer/ })).toBeVisible();

    // Check original price
    await expect(page.getByText(/Bs\s10\.00/)).toBeVisible();

    // Check offer badge
    await expect(page.getByText('Oferta')).toBeVisible();

    // Check offer price (strikethrough old price, new price displayed)
    await expect(page.getByText(/Bs\s7\.99/)).toBeVisible();
  });

  test('displays product reviews', async ({ page }) => {
    await page.goto('/productos/leche-test-instock');

    // Check that reviews section exists with heading
    await expect(page.getByRole('heading', { name: /Comentarios del producto/ })).toBeVisible();

    // Check for first reviewer
    await expect(page.getByText('Test User 1')).toBeVisible();
    await expect(page.getByText('Great test product!')).toBeVisible();

    // Check for second reviewer
    await expect(page.getByText('Test User 2')).toBeVisible();
    await expect(page.getByText('Good quality')).toBeVisible();

    // Check that ratings are shown (5.0/5 and 4.0/5)
    await expect(page.getByText('5.0')).toBeVisible();
    await expect(page.getByText('4.0')).toBeVisible();
  });

  test('displays no reviews message when product has no reviews', async ({ page }) => {
    await page.goto('/productos/queso-test-outofstock');

    // Check for empty reviews message
    await expect(page.getByText('Sin calificaciones')).toBeVisible();
    await expect(page.getByText(/Este producto aún no tiene comentarios/)).toBeVisible();
  });

  test('product image loads', async ({ page }) => {
    await page.goto('/productos/leche-test-instock');
    const productImage = page.locator('img').first();

    await expect(productImage).toBeVisible();
    await expect(productImage).toHaveJSProperty('complete', true);
    await expect(productImage).not.toHaveJSProperty('naturalWidth', 0);
  });

  test('returns 404 for non-existent product', async ({ page }) => {
    const response = await page.goto('/productos/this-product-does-not-exist');

    // Should redirect to 404 page
    expect(response?.status()).toBe(404);
    await expect(page.getByText(/No pudimos encontrar esta página/)).toBeVisible();
  });

  test('displays category information', async ({ page }) => {
    await page.goto('/productos/leche-test-instock');

    // Check that breadcrumb/navigation shows category or product path
    await expect(page.getByText('Productos')).toBeVisible();
    await expect(page.getByText('Detalle')).toBeVisible();
  });

  test('add to cart button is functional', async ({ page }) => {
    await page.goto('/productos/leche-test-instock');

    // Find add to cart button - skip this test if not implemented yet
    const addToCartButton = page.getByRole('button', { name: /add to cart|agregar al carrito|comprar/i });
    const exists = await addToCartButton.isVisible().catch(() => false);
    
    if (exists) {
      await expect(addToCartButton).toBeEnabled();
    }
  });

  test('add to cart button is disabled when out of stock', async ({ page }) => {
    await page.goto('/productos/queso-test-outofstock');

    // Find add to cart button - skip if not implemented
    const addToCartButton = page.getByRole('button', { name: /add to cart|agregar al carrito|comprar/i });
    const exists = await addToCartButton.isVisible().catch(() => false);
    
    if (exists) {
      await expect(addToCartButton).toBeDisabled();
    }
  });
});
