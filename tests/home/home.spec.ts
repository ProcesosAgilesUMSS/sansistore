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
        name: 'SansiStore para la comunidad UMSS',
      })
    ).toBeVisible();
    await expect(page.getByPlaceholder('¿Qué estás buscando hoy?')).toHaveAttribute(
      'placeholder',
      '¿Qué estás buscando hoy?'
    );
  });

  test('opens the products catalog when focusing the home search', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.getByPlaceholder('¿Qué estás buscando hoy?').click();
    await expect(page).toHaveURL('/productos');
  });
});
