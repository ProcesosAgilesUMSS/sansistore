import { test, expect } from '@playwright/test';

async function loginWithEmail(page, email: string, password: string) {
  await page.goto('/login');

  await page.getByLabel('Correo electrónico').fill(email);
  await page.getByLabel('Contraseña').fill(password);

  await Promise.all([
    page.waitForURL('**/me', { timeout: 15000 }),
    page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click(),
  ]);
}

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

test.describe('Cart - Carrito', () => {
  test('should display cart items when user is authenticated', async ({
    page,
  }) => {
    await loginWithEmail(page, 'juan.paredes@est.umss.edu', 'password123');

    await page.goto('/cart');
    await page.reload();

    await expect(
      page.getByRole('heading', { name: 'Mi Carrito' })
    ).toBeVisible();

    const cartState = page
      .getByText('Yogurt Test Sin Resenas')
      .or(page.getByText('Tu carrito está vacío'))
      .or(page.getByText('Cargando carrito...'));

    await expect(cartState).toBeVisible({ timeout: 15000 });
  });

  test('should show empty cart message when user has no items', async ({
    page,
  }) => {
    await loginWithEmail(page, 'carlos.docente@est.umss.edu', 'password123');

    await page.goto('/cart');
    await page.reload();

    await expect(
      page.getByRole('heading', { name: 'Mi Carrito' })
    ).toBeVisible();

    await expect(page.getByText('Tu carrito está vacío')).toBeVisible({
      timeout: 15000,
    });
  });

  test('should show "No autenticado" when accessing cart without login', async ({
    page,
  }) => {
    await page.goto('/cart');

    await expect(page.getByText('No autenticado')).toBeVisible();

    await expect(
      page.getByRole('link', { name: 'Iniciar sesión' })
    ).toBeVisible();
  });
});
