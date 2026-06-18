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
    await page.goto('/');
    await expect(page).toHaveTitle(/Sansistore/);
  });

  test('redirects to products catalog', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL('/productos');
    await expect(
      page.getByRole('heading', { name: 'Productos disponibles' })
    ).toBeVisible();
  });

  test('shows products page after entering home', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Productos \| Sansistore/);
  });
});
