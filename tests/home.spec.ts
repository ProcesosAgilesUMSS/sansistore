import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test('has correct title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Sansistore/);
  });

  test('displays welcome heading', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Bienvenido a Sansistore' })).toBeVisible();
  });

  test('has products link', async ({ page }) => {
    await page.goto('/');
    const link = page.getByRole('link', { name: 'Ver Productos' });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', '/productos');
  });
});