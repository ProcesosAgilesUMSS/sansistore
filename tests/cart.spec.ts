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

test.describe('Cart - Carrito', () => {
  test('should display cart items when user is authenticated', async ({
    page,
  }) => {
    await page.goto('/login');

    const emailField = page.getByLabel('Correo electrónico');
    const passwordField = page.getByLabel('Contraseña');

    await emailField.fill('juan.paredes@est.umss.edu');
    await passwordField.fill('password123');

    await page
      .getByRole('button', { name: 'Iniciar sesión', exact: true })
      .click();

    await expect(page).toHaveURL('/me');

    await page.goto('/cart');

    await expect(
      page.getByRole('heading', { name: 'Mi Carrito' })
    ).toBeVisible();

    await expect(page.getByText('Leche PIL Natural 900 ml')).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText('Galletas Agua Victoria 120 gr')).toBeVisible();
    await expect(page.getByText('Subtotal')).toBeVisible();
    await expect(page.getByText('Total de compra')).toBeVisible();
    await expect(page.getByText('Bs 27.40')).toBeVisible();
    await expect(page.getByText(/Stock disponible:/)).toBeVisible();
    await expect(page.getByText('Disponible para confirmar')).toBeVisible();
  });

  test('should show empty cart message when user has no items', async ({
    page,
  }) => {
    await page.goto('/login');

    const emailField = page.getByLabel('Correo electrónico');
    const passwordField = page.getByLabel('Contraseña');

    await emailField.fill('carlos.docente@est.umss.edu');
    await passwordField.fill('password123');

    await page
      .getByRole('button', { name: 'Iniciar sesión', exact: true })
      .click({ timeout: 1000 });

    await page.goto('/cart');

    await expect(
      page.getByRole('heading', { name: 'Mi Carrito' })
    ).toBeVisible();

    await expect(page.getByText('Tu carrito está vacío')).toBeVisible({
      timeout: 1000,
    });
    await expect(page.getByText('Total de compra')).toBeVisible();
    await expect(page.getByText('Bs 0.00')).toBeVisible();
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
