import { test, expect, type Page } from '@playwright/test';

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
  async function expectProductsPageVisible(page: Page) {
    await expect(
      page.getByRole('heading', { name: 'Productos disponibles' })
    ).toBeVisible({ timeout: 15_000 });
  }

  async function expectSearchReady(page: Page) {
    await expectProductsPageVisible(page);
    await expect(
      page.getByRole('textbox', { name: '¿Qué estás buscando hoy?' })
    ).toBeEnabled({ timeout: 15_000 });
  }

  test('load products page', async ({ page }) => {
    await page.goto('/productos');

    await expect(page).toHaveTitle(/Productos \| Sansistore/);

    await expectProductsPageVisible(page);

    await expect(
      page.getByRole('button', { name: 'Todas las categorías' })
    ).toBeVisible();
    await expect(page.getByRole('button', { name: /Activar filtro Solo ofertas/ })).toBeVisible();
  });

  test('Ofertas', async ({ page }) => {
    await page.goto('/productos');
    await expectProductsPageVisible(page);

    await page.getByRole('button', { name: /Activar filtro Solo ofertas/ }).click();
    await expect(
      page.getByText(/Detergente Liquido Ola Futuro Limpieza Completa 5 L/)
    ).toBeVisible({ timeout: 15_000 });
  });

  test('Categorias', async ({ page }) => {
    await page.goto('/productos?category=lacteos');
    const url = new URL(page.url());
    expect(url.searchParams.get('category')).toBe('lacteos');
    await expect(
      page.getByRole('heading', { name: 'Productos disponibles' })
    ).toBeVisible();
  });

  test('Buscar', async ({ page }) => {
    await page.goto('/productos');
    await expectSearchReady(page);

    await page
      .getByRole('textbox', { name: '¿Qué estás buscando hoy?' })
      .fill('Leche');
    await page.getByRole('link', { name: /Ver detalle de Leche PIL Natural 900 ml/ }).click();
    await expect(
      page.getByRole('heading', { name: /Leche PIL Natural 900 ml/ })
    ).toBeVisible();
    await expect(page.getByText('Stock: 24 disponibles')).toBeVisible();
  });

  test('Search with URL params', async ({ page }) => {
    await page.goto('/productos?q=Leche');
    await expectSearchReady(page);

    const searchInput = page.getByRole('textbox', {
      name: '¿Qué estás buscando hoy?',
    });
    await expect(searchInput).toHaveValue('Leche');
    const url = new URL(page.url());
    expect(url.searchParams.get('q')).toBe('Leche');
  });

  test('Category filter with URL params', async ({ page }) => {
    await page.goto('/productos?category=lacteos');

    const url = new URL(page.url());
    expect(url.searchParams.get('category')).toBe('lacteos');
    await expect(
      page.getByRole('heading', { name: 'Productos disponibles' })
    ).toBeVisible();
  });

  test('Offers filter with URL params', async ({ page }) => {
    await page.goto('/productos?offers=true');
    await expectProductsPageVisible(page);

    const offersButton = page.getByRole('button', { name: /Quitar filtro Solo ofertas/ });
    await expect(offersButton).toHaveAttribute('aria-pressed', 'true');
    await expect(
      page.getByText(/Detergente Liquido Ola Futuro Limpieza Completa 5 L/)
    ).toBeVisible({ timeout: 15_000 });
  });

  test('Sort by name A-Z', async ({ page }) => {
    await page.goto('/productos?sort=name-asc');

    const url = new URL(page.url());
    expect(url.searchParams.get('sort')).toBe('name-asc');
    await expect(
      page.getByRole('heading', { name: 'Productos disponibles' })
    ).toBeVisible();
  });

  test('Combined filters with URL params', async ({ page }) => {
    await page.goto('/productos?q=Leche&category=lacteos&sort=name-asc&page=1');
    await expectSearchReady(page);

    const searchInput = page.getByRole('textbox', {
      name: '¿Qué estás buscando hoy?',
    });
    await expect(searchInput).toHaveValue('Leche');

    const url = new URL(page.url());
    expect(url.searchParams.get('q')).toBe('Leche');
    expect(url.searchParams.get('category')).toBe('lacteos');
    await page.getByRole('button', { name: 'Lácteos' }).click();
    const updatedUrl = new URL(page.url());
    expect(updatedUrl.searchParams.get('sort')).toBe('name-asc');
    expect(updatedUrl.searchParams.get('page')).toBe('1');
  });

});
