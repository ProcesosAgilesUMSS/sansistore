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

test.describe('Avaiable product list', () => {
  test('defaults to best sellers sorting', async ({ page }) => {
    await page.goto('/productos');

    await expect(
      page.getByRole('button', { name: 'Ordenar productos' })
    ).toContainText('Mas vendidos');

    const productLinks = page.locator('a[aria-label^="Ver detalle de "]');
    await expect(productLinks.nth(0)).toHaveAttribute(
      'href',
      '/productos/arroz-grano-de-oro-caisy-1-kg'
    );
    await expect(productLinks.nth(1)).toHaveAttribute(
      'href',
      '/productos/leche-pil-natural-900-ml'
    );
    await expect(productLinks.nth(2)).toHaveAttribute(
      'href',
      '/productos/queso-crema-bonle-pil-andina-200-gr'
    );
  });

  test('load products page', async ({ page }) => {
    await page.goto('/productos');

    await expect(page).toHaveTitle(/Productos | Sansistore/);

    await expect(
      page.getByRole('heading', { name: 'Productos disponibles' })
    ).toBeVisible();

    await expect(page.getByRole('button', { name: 'Categoría' })).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Solo Ofertas' })
    ).toBeVisible();
  });

  test('Ofertas', async ({ page }) => {
    await page.goto('/productos');

    await page.getByRole('button', { name: 'Solo Ofertas' }).click();
    await expect(
      page.getByText(/Detergente Liquido Ola Futuro Limpieza Completa 5 L/)
    ).toBeVisible();
  });

  test('Categorias', async ({ page }) => {
    await page.goto('/productos');
    await page.getByRole('button', { name: 'Todas las categorías' }).click();
    await expect(page.getByText(/Lácteos/)).toBeVisible();
    await expect(page.getByText(/Bebidas/)).toBeVisible();
  });

  test('Buscar', async ({ page }) => {
    await page.goto('/productos');

    await page
      .getByRole('textbox', { name: '¿Qué estás buscando hoy?' })
      .fill('Leche');
    await page
      .getByRole('button', { name: 'Leche PIL Natural 900 ml' })
      .click();
    await expect(page.getByText(/9\.70/)).toBeVisible();
  });

  test('Search with URL params', async ({ page }) => {
    await page.goto('/productos?q=Leche');

    const searchInput = page.getByRole('textbox', {
      name: '¿Qué estás buscando hoy?',
    });
    await expect(searchInput).toHaveValue('Leche');
    await expect(page.getByText(/Leche PIL Natural 900 ml/)).toBeVisible();
  });

  test('Category filter with URL params', async ({ page }) => {
    await page.goto('/productos?category=lacteos');

    await expect(page.getByRole('button', { name: 'Lácteos' })).toBeVisible();
    await expect(
      page.getByText(/Queso Crema Bonle PIL Andina 200 gr/)
    ).toBeVisible();
  });

  test('Offers filter with URL params', async ({ page }) => {
    await page.goto('/productos?offers=true');

    const offersButton = page.getByRole('button', { name: 'Solo Ofertas' });
    await expect(offersButton).toHaveAttribute('aria-pressed', 'true');
    await expect(
      page.getByText(/Detergente Liquido Ola Futuro Limpieza Completa 5 L/)
    ).toBeVisible();
  });

  test('Sort by name A-Z', async ({ page }) => {
    await page.goto('/productos');

    const sortButton = page.getByRole('button', { name: 'Ordenar productos' });
    await sortButton.click();

    await page.getByRole('button', { name: 'A-Z' }).click();

    const url = new URL(page.url());
    expect(url.searchParams.get('sort')).toBe('name-asc');
  });

  test('Sort by name Z-A', async ({ page }) => {
    await page.goto('/productos');

    const sortButton = page.getByRole('button', { name: 'Ordenar productos' });
    await sortButton.click();

    await page.getByRole('button', { name: 'Z-A' }).click();

    const url = new URL(page.url());
    expect(url.searchParams.get('sort')).toBe('name-desc');
  });

  test('Combined filters with URL params', async ({ page }) => {
    await page.goto('/productos?q=Leche&category=lacteos&sort=name-asc&page=1');

    const searchInput = page.getByRole('textbox', {
      name: '¿Qué estás buscando hoy?',
    });
    await expect(searchInput).toHaveValue('Leche');

    const url = new URL(page.url());
    expect(url.searchParams.get('q')).toBe('Leche');
    expect(url.searchParams.get('category')).toBe('lacteos');
    await page.getByRole('button', { name: 'Lácteos' }).click();
    expect(url.searchParams.get('sort')).toBe('name-asc');
    expect(url.searchParams.get('page')).toBe('1');
  });

  test('shows popular badge in catalog', async ({ page }) => {
    await page.goto('/productos');

    const arrozCard = page.locator('article').filter({
      has: page.locator('a[href="/productos/arroz-grano-de-oro-caisy-1-kg"]'),
    });
    await expect(arrozCard.getByText('Popular')).toBeVisible();
  });

  test('falls back to recent when all sold counts are zero', async ({
    page,
  }) => {
    await page.goto('/productos?q=Aceite');

    await expect(
      page.getByRole('button', { name: 'Ordenar productos' })
    ).toContainText('Mas vendidos');
    await expect(page.getByText(/Aceite Fino Vegetal 900 ml/)).toBeVisible();
  });
});
