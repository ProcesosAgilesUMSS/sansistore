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
      .filter({ hasText: 'pu4-qsc' });
    await expect(assignedOrder).toBeVisible({ timeout: 15_000 });
    await expect(assignedOrder.getByText('1x Detergente Liquido Ola Futuro Limpieza Completa 5 L — Bs 109')).toBeVisible();
    await expect(assignedOrder.getByText('10x Leche PIL Natural 900 ml — Bs 9.7')).toBeVisible();
    await expect(assignedOrder.getByText('Cancha principal FCyT')).toBeVisible();
  });

  test('opens buyer location in the internal Leaflet map', async ({ page }) => {
    await loginAsCourier(page);
    await page.goto('/courier');

    const assignedOrder = page
      .locator('article')
      .filter({ hasText: 'pu4-qsc' });
    await expect(assignedOrder).toBeVisible({ timeout: 15_000 });

    await assignedOrder.getByRole('link', { name: 'Abrir Maps' }).click();

    await expect(page).toHaveURL("/mapa?lat=-17.395102&lng=-66.145782&order=019e74a3-e030-74ce-9d9a-4b1d37b85d11_pu4-qsc");
    await expect(page.getByText('1x Detergente Liquido Ola Futuro Limpieza Completa 5 L')).toBeVisible();
    await expect(page.getByText('10x Leche PIL Natural 900 ml')).toBeVisible();
  });
});
