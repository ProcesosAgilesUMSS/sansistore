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

test.describe('Home Page', () => {
  test('has correct title', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveTitle(/Sansistore/);
  });

  test('shows the landing page', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(
      page.getByRole('heading', {
        name: 'Productos destacados',
      })
    ).toBeVisible();
    await expect(page.getByRole('link', { name: 'Buscar productos en el catálogo' })).toHaveAttribute(
      'href',
      '/productos'
    );
  });

  test('opens the products catalog from the home search', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.getByRole('link', { name: 'Buscar productos en el catálogo' }).click();
    await expect(page).toHaveURL('/productos');
  });
});
