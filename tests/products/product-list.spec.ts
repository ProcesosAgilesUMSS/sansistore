import { test, expect } from '@playwright/test';
import { ProductListPage } from '../pages/product-list.page';

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

test.describe('Avaiable product list', () => {
  let products: ProductListPage;

  test.beforeEach(({ page }) => {
    products = new ProductListPage(page);
  });

  test('load products page', async ({ page }) => {
    await products.goto();

    await expect(page).toHaveTitle(/Productos \| Sansistore/);

    await products.expectVisible();

    await expect(
      page.getByRole('button', { name: 'Todas las categorías' })
    ).toBeVisible();
    await expect(page.getByRole('button', { name: /Activar filtro Solo ofertas/ })).toBeVisible();
  });

  test('Ofertas', async ({ page }) => {
    await products.goto('?offers=true');
    await products.expectVisible();
    await expect(
      page.getByRole('button', { name: /Quitar filtro Solo ofertas/ })
    ).toHaveAttribute('aria-pressed', 'true');
  });

  test('Categorias', async ({ page }) => {
    await products.goto('?category=lacteos');
    const url = new URL(page.url());
    expect(url.searchParams.get('category')).toBe('lacteos');
    await products.expectVisible();
  });

  test('Buscar', async ({ page }) => {
    await products.goto('?q=Leche');
    await products.expectVisible();
    await expect(products.searchInput).toHaveValue('Leche');
    await page.goto('/productos/leche-pil-natural-900-ml', {
      waitUntil: 'domcontentloaded',
    });
    try {
      await expect(
        page.getByRole('heading', { name: /Leche PIL Natural 900 ml/ })
      ).toBeVisible({ timeout: 15_000 });
    } catch {
      await page.reload({ waitUntil: 'domcontentloaded' });
      await expect(
        page.getByRole('heading', { name: /Leche PIL Natural 900 ml/ })
      ).toBeVisible({ timeout: 15_000 });
    }
    await expect(page.getByText('Stock: 24 disponibles')).toBeVisible();
  });

  test('Search with URL params', async ({ page }) => {
    await products.goto('?q=Leche');
    await products.expectVisible();

    await expect(products.searchInput).toHaveValue('Leche');
    const url = new URL(page.url());
    expect(url.searchParams.get('q')).toBe('Leche');
  });

  test('Category filter with URL params', async ({ page }) => {
    await products.goto('?category=lacteos');

    const url = new URL(page.url());
    expect(url.searchParams.get('category')).toBe('lacteos');
    await products.expectVisible();
  });

  test('Offers filter with URL params', async ({ page }) => {
    await products.goto('?offers=true');
    await products.expectVisible();

    const offersButton = page.getByRole('button', { name: /Quitar filtro Solo ofertas/ });
    await expect(offersButton).toHaveAttribute('aria-pressed', 'true');
    await expect(
      page.getByText(/Detergente Liquido Ola Futuro Limpieza Completa 5 L/)
    ).toBeVisible({ timeout: 15_000 });
  });

  test('Sort by name A-Z', async ({ page }) => {
    await products.goto('?sort=name-asc');

    const url = new URL(page.url());
    expect(url.searchParams.get('sort')).toBe('name-asc');
    await products.expectVisible();
  });

  test('Combined filters with URL params', async ({ page }) => {
    await products.goto('?q=Leche&category=lacteos&sort=name-asc&page=1');
    await products.expectSearchReady();

    await expect(products.searchInput).toHaveValue('Leche');

    const url = new URL(page.url());
    expect(url.searchParams.get('q')).toBe('Leche');
    expect(url.searchParams.get('category')).toBe('lacteos');
    await page.getByRole('button', { name: 'Lácteos' }).click();
    const updatedUrl = new URL(page.url());
    expect(updatedUrl.searchParams.get('sort')).toBe('name-asc');
    expect(updatedUrl.searchParams.get('page')).toBe('1');
  });

});
