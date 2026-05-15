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
    test('load products page', async ({ page }) => {
        await page.goto('/productos');

        await expect(page).toHaveTitle(/Productos | Sansistore/);

        await expect(page.getByRole('heading', { name: 'Productos disponibles' })).toBeVisible();


        await expect(page.getByRole('button', { name: 'Categoría' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Solo Ofertas' })).toBeVisible();


    });


    test('Ofertas', async ({ page }) => {
        await page.goto('/productos');

        await (page.getByRole('button', { name: 'Solo Ofertas' }).click());
        await expect(page.getByText(/Detergente Liquido Ola Futuro Limpieza Completa 5 L/)).toBeVisible();

    });

    test('Categorias', async ({ page }) => {
        await page.goto('/productos');
        await (page.getByRole('button', { name: 'Todas las categorías' }).click());
        await expect(page.getByText(/Lácteos/)).toBeVisible();
        await expect(page.getByText(/Bebidas/)).toBeVisible();

    });

    test('Buscar', async ({ page }) => {
        await page.goto('/productos');

        await (page.getByRole('textbox', { name: '¿Qué estás buscando hoy?' }).fill('Leche'));
        await (page.getByRole('button', { name: 'Leche PIL Natural 900 ml' }).click());
        await expect(page.getByText(/9\.70/)).toBeVisible();
    });

    test('Search with URL params', async ({ page }) => {
        await page.goto('/productos?q=Leche');

        const searchInput = page.getByRole('textbox', { name: '¿Qué estás buscando hoy?' });
        await expect(searchInput).toHaveValue('Leche');
        await expect(page.getByText(/Leche PIL Natural 900 ml/)).toBeVisible();
    });

    test('Category filter with URL params', async ({ page }) => {
        await page.goto('/productos?category=lacteos');

        await expect(page.getByRole('button', { name: 'Lácteos' })).toBeVisible();
        await expect(page.getByText(/Queso Crema Bonle PIL Andina 200 gr/)).toBeVisible();
    });

    test('Offers filter with URL params', async ({ page }) => {
        await page.goto('/productos?offers=true');

        const offersButton = page.getByRole('button', { name: 'Solo Ofertas' });
        await expect(offersButton).toHaveAttribute('aria-pressed', 'true');
        await expect(page.getByText(/Detergente Liquido Ola Futuro Limpieza Completa 5 L/)).toBeVisible();
    });

    test('Sort by name A-Z', async ({ page }) => {
        await page.goto('/productos');

        const sortButton = page.getByRole('button', { name: 'Ordenar productos' });
        await sortButton.click();

        await page.getByRole('button', { name: 'Nombre A-Z' }).click();

        const url = new URL(page.url());
        expect(url.searchParams.get('sort')).toBe('name');
    });

    test('Sort by price ascending', async ({ page }) => {
        await page.goto('/productos');

        const sortButton = page.getByRole('button', { name: 'Ordenar productos' });
        await sortButton.click();

        await page.getByRole('button', { name: 'Precio: Menor a Mayor' }).click();

        const url = new URL(page.url());
        expect(url.searchParams.get('sort')).toBe('price-asc');
    });

    test('Combined filters with URL params', async ({ page }) => {
        await page.goto('/productos?q=Leche&category=lacteos&sort=name&page=1');

        const searchInput = page.getByRole('textbox', { name: '¿Qué estás buscando hoy?' });
        await expect(searchInput).toHaveValue('Leche');

        const url = new URL(page.url());
        expect(url.searchParams.get('q')).toBe('Leche');
        expect(url.searchParams.get('category')).toBe('lacteos');
        await page.getByRole('button', { name: 'Lácteos' }).click();
        expect(url.searchParams.get('sort')).toBe('name');
        expect(url.searchParams.get('page')).toBe('1');
    });

});
