import { expect, test, type Page } from '@playwright/test';

async function loginAsCourier(page: Page) {
  await page.goto('/login');

  const loginButton = page
    .locator('form')
    .getByRole('button', { name: /Iniciar/ });

  await expect(loginButton).toBeEnabled({ timeout: 15_000 });
  await expect(page.locator('#email')).toBeEditable();
  await expect(page.locator('#password')).toBeEditable();
  await expect
    .poll(
      async () =>
        page.evaluate(() => {
          const button = document
            .querySelector('form')
            ?.querySelector('button[type="button"]');

          return Boolean(
            button &&
            Object.keys(button).some((key) => key.startsWith('__reactProps'))
          );
        }),
      { timeout: 15_000 }
    )
    .toBe(true);

  await page.locator('#email').fill('luis.mensajero@est.umss.edu');
  await page.locator('#password').fill('12345678');
  await loginButton.click({ noWaitAfter: true });

  await expect(page).not.toHaveURL(/\/login/, { timeout: 30_000 });
}

test.describe('Courier smoke tests', () => {
  test('shows totals calculated from order items and allowed zone labels', async ({
    page,
  }) => {
    await loginAsCourier(page);
    await page.goto('/courier');

    const assignedOrder = page
      .locator('article')
      .filter({ hasText: '#order-005' });
    await expect(assignedOrder).toBeVisible({ timeout: 15_000 });
    await expect(assignedOrder.getByText('2x Fideo')).toBeVisible();
    await expect(assignedOrder.getByText('2x Galletas')).toBeVisible();
    await expect(assignedOrder.getByText('Bs 29')).toBeVisible();
    await expect(assignedOrder.getByText('Campus Central')).toBeVisible();
  });

  test('opens buyer location in the internal Leaflet map', async ({ page }) => {
    await loginAsCourier(page);
    await page.goto('/courier');

    const assignedOrder = page
      .locator('article')
      .filter({ hasText: '#order-005' });
    await expect(assignedOrder).toBeVisible({ timeout: 15_000 });

    await assignedOrder.getByRole('link', { name: 'Abrir Maps' }).click();

    await expect(page).toHaveURL(/\/mapa\?lat=-17\.392677&lng=-66\.145704/);
    await expect(page.locator('.leaflet-container')).toBeVisible();
    await expect(page.getByRole('heading', { name: /Mar/ })).toBeVisible();
    await expect(page.getByText('Biblioteca FCyT')).toBeVisible();
    await expect(page.getByText('Bs 29')).toBeVisible();
  });
});
