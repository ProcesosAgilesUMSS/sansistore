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
        name: 'Bienvenido a SansiStore',
      })
    ).toBeVisible();
    await expect(page.getByPlaceholder('¿Qué estás buscando hoy?')).toHaveAttribute(
      'placeholder',
      '¿Qué estás buscando hoy?'
    );
  });

  test('prepares the catalog search when requested from home flow', async ({ page }) => {
    await page.goto('/productos?focusSearch=true', { waitUntil: 'domcontentloaded' });
    await expect(page.getByPlaceholder('¿Qué estás buscando hoy?')).not.toHaveAttribute('disabled', {
      timeout: 15_000,
    });
  });
});
